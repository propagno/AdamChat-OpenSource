from flask import Blueprint, request, jsonify, current_app, url_for
from flask_jwt_extended import jwt_required, get_jwt_identity
import stripe
import logging
import json
from app.models.user import User
from app.models.subscription import Subscription, SubscriptionPlan
from app.models.payment import Payment, PaymentMethod
from app.utils.token_manager import add_tokens
from app.extensions import db
from datetime import datetime, timedelta

payment_bp = Blueprint('payment', __name__)
logger = logging.getLogger(__name__)

# Configurações do Stripe
stripe_api_key = None
stripe_webhook_secret = None


def init_stripe():
    global stripe_api_key, stripe_webhook_secret
    if stripe_api_key is None:
        stripe_api_key = current_app.config.get('STRIPE_SECRET_KEY')
        stripe_webhook_secret = current_app.config.get('STRIPE_WEBHOOK_SECRET')
        if stripe_api_key:
            stripe.api_key = stripe_api_key


@payment_bp.route('/plans', methods=['GET'])
@jwt_required()
def get_plans():
    """
    Obtém a lista de planos disponíveis
    ---
    Requer autenticação JWT
    Retorna lista de planos disponíveis para assinatura
    """
    try:
        init_stripe()
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user:
            return jsonify({"error": "Usuário não encontrado"}), 404

        # Obtém planos do banco de dados
        plans = SubscriptionPlan.query.filter_by(is_active=True).all()

        # Obtém assinatura atual do usuário
        current_subscription = Subscription.query.filter_by(
            user_id=user_id,
            status='active'
        ).first()

        plans_data = []
        for plan in plans:
            plan_data = plan.to_dict()

            # Adiciona informação se é o plano atual do usuário
            if current_subscription and current_subscription.plan_id == plan.id:
                plan_data['is_current'] = True
            else:
                plan_data['is_current'] = False

            plans_data.append(plan_data)

        # Prepara informações da assinatura atual
        current_plan = None
        if current_subscription:
            current_plan = {
                "id": current_subscription.id,
                "plan_id": current_subscription.plan_id,
                "plan_name": current_subscription.plan.name,
                "price": current_subscription.plan.price,
                "start_date": current_subscription.start_date.isoformat(),
                "end_date": current_subscription.end_date.isoformat() if current_subscription.end_date else None,
                "tokens_available": current_subscription.tokens_remaining,
                "tokens_used": current_subscription.tokens_used,
                "messages_available": current_subscription.messages_remaining,
                "messages_used": current_subscription.messages_used,
                "auto_renew": current_subscription.auto_renew
            }

        return jsonify({
            "plans": plans_data,
            "current_plan": current_plan
        }), 200

    except Exception as e:
        logger.exception(f"Erro ao obter planos: {str(e)}")
        return jsonify({"error": f"Erro ao obter planos: {str(e)}"}), 500


@payment_bp.route('/methods', methods=['GET'])
@jwt_required()
def get_payment_methods():
    """
    Obtém os métodos de pagamento do usuário
    ---
    Requer autenticação JWT
    Retorna lista de métodos de pagamento cadastrados
    """
    try:
        init_stripe()
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user:
            return jsonify({"error": "Usuário não encontrado"}), 404

        # Métodos de pagamento locais
        local_methods = PaymentMethod.query.filter_by(
            user_id=user_id, is_deleted=False).all()

        # Se tiver Stripe configurado e cliente vinculado, busca também no Stripe
        payment_methods = []

        if stripe_api_key and user.stripe_customer_id:
            try:
                stripe_methods = stripe.PaymentMethod.list(
                    customer=user.stripe_customer_id,
                    type="card"
                )

                # Mescla métodos do Stripe com os locais
                for method in stripe_methods.data:
                    stripe_method = {
                        "id": method.id,
                        "type": "card",
                        "provider": "stripe",
                        "card": {
                            "brand": method.card.brand,
                            "last4": method.card.last4,
                            "exp_month": method.card.exp_month,
                            "exp_year": method.card.exp_year,
                            "country": method.card.country
                        },
                        "is_default": method.id == user.default_payment_method_id
                    }
                    payment_methods.append(stripe_method)
            except stripe.error.StripeError as e:
                logger.error(
                    f"Erro ao buscar métodos de pagamento no Stripe: {str(e)}")

        # Adiciona métodos locais
        for method in local_methods:
            local_method = {
                "id": method.id,
                "type": method.type,
                "provider": method.provider,
                "details": json.loads(method.details) if method.details else {},
                "is_default": method.is_default
            }
            payment_methods.append(local_method)

        return jsonify({"payment_methods": payment_methods}), 200

    except Exception as e:
        logger.exception(f"Erro ao obter métodos de pagamento: {str(e)}")
        return jsonify({"error": f"Erro ao obter métodos de pagamento: {str(e)}"}), 500


@payment_bp.route('/methods', methods=['POST'])
@jwt_required()
def add_payment_method():
    """
    Adiciona um novo método de pagamento
    ---
    Requer autenticação JWT
    Suporta adição de cartão via Stripe ou outros métodos
    """
    try:
        init_stripe()
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user:
            return jsonify({"error": "Usuário não encontrado"}), 404

        data = request.json

        # Verificar dados mínimos
        if not data or 'type' not in data:
            return jsonify({"error": "Dados incompletos"}), 400

        method_type = data.get('type')

        # Processamento para o Stripe
        if method_type == 'card' and stripe_api_key:
            # Verifica se recebemos um token ou método de pagamento do Stripe
            payment_token = data.get('token')
            if not payment_token:
                return jsonify({"error": "Token de pagamento não fornecido"}), 400

            # Cria ou atualiza cliente no Stripe
            if not user.stripe_customer_id:
                # Cria um novo cliente no Stripe
                customer = stripe.Customer.create(
                    email=user.email,
                    name=user.name,
                    metadata={"user_id": user.id}
                )

                user.stripe_customer_id = customer.id
                db.session.commit()

            # Anexa o método de pagamento ao cliente
            try:
                payment_method = stripe.PaymentMethod.attach(
                    payment_token,
                    customer=user.stripe_customer_id
                )

                # Define como padrão se for o primeiro ou solicitado
                if data.get('set_default', False) or not user.default_payment_method_id:
                    stripe.Customer.modify(
                        user.stripe_customer_id,
                        invoice_settings={
                            'default_payment_method': payment_method.id
                        }
                    )

                    user.default_payment_method_id = payment_method.id
                    db.session.commit()

                return jsonify({
                    "success": True,
                    "payment_method": {
                        "id": payment_method.id,
                        "type": payment_method.type,
                        "provider": "stripe",
                        "card": {
                            "brand": payment_method.card.brand,
                            "last4": payment_method.card.last4,
                            "exp_month": payment_method.card.exp_month,
                            "exp_year": payment_method.card.exp_year
                        }
                    }
                }), 201

            except stripe.error.StripeError as e:
                logger.error(
                    f"Erro ao processar pagamento no Stripe: {str(e)}")
                return jsonify({"error": f"Erro ao processar pagamento: {str(e)}"}), 400

        # Processamento para outros métodos de pagamento (local)
        else:
            # Salva detalhes do método de pagamento localmente
            new_method = PaymentMethod(
                user_id=user_id,
                type=method_type,
                provider=data.get('provider', 'local'),
                details=json.dumps(data.get('details', {})),
                is_default=data.get('set_default', False)
            )

            # Se for definido como padrão, remove o padrão dos outros
            if new_method.is_default:
                PaymentMethod.query.filter_by(
                    user_id=user_id, is_default=True).update({"is_default": False})

            db.session.add(new_method)
            db.session.commit()

            return jsonify({
                "success": True,
                "payment_method": {
                    "id": new_method.id,
                    "type": new_method.type,
                    "provider": new_method.provider,
                    "details": json.loads(new_method.details) if new_method.details else {},
                    "is_default": new_method.is_default
                }
            }), 201

    except Exception as e:
        logger.exception(f"Erro ao adicionar método de pagamento: {str(e)}")
        return jsonify({"error": f"Erro ao adicionar método de pagamento: {str(e)}"}), 500


@payment_bp.route('/methods/<method_id>', methods=['DELETE'])
@jwt_required()
def delete_payment_method(method_id):
    """
    Remove um método de pagamento
    ---
    Requer autenticação JWT
    Remove métodos do Stripe ou locais
    """
    try:
        init_stripe()
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user:
            return jsonify({"error": "Usuário não encontrado"}), 404

        # Verifica se é um método do Stripe
        if stripe_api_key and method_id.startswith('pm_'):
            try:
                # Verifica se o usuário possui este método
                payment_method = stripe.PaymentMethod.retrieve(method_id)
                if payment_method.customer != user.stripe_customer_id:
                    return jsonify({"error": "Método de pagamento não pertence ao usuário"}), 403

                # Remove o método
                stripe.PaymentMethod.detach(method_id)

                # Se era o padrão, remove a referência
                if user.default_payment_method_id == method_id:
                    user.default_payment_method_id = None
                    db.session.commit()

                return jsonify({"success": True, "message": "Método de pagamento removido"}), 200

            except stripe.error.StripeError as e:
                logger.error(
                    f"Erro ao remover método de pagamento no Stripe: {str(e)}")
                return jsonify({"error": f"Erro ao remover método de pagamento: {str(e)}"}), 400

        # Processamento para métodos locais
        else:
            try:
                method_id_int = int(method_id)
                method = PaymentMethod.query.filter_by(
                    id=method_id_int, user_id=user_id).first()

                if not method:
                    return jsonify({"error": "Método de pagamento não encontrado"}), 404

                # Exclusão lógica
                method.is_deleted = True
                method.deleted_at = datetime.utcnow()

                # Se era o padrão, remove o status
                if method.is_default:
                    method.is_default = False

                db.session.commit()

                return jsonify({"success": True, "message": "Método de pagamento removido"}), 200

            except ValueError:
                return jsonify({"error": "ID de método de pagamento inválido"}), 400

    except Exception as e:
        logger.exception(f"Erro ao remover método de pagamento: {str(e)}")
        return jsonify({"error": f"Erro ao remover método de pagamento: {str(e)}"}), 500


@payment_bp.route('/upgrade', methods=['POST'])
@jwt_required()
def upgrade_plan():
    """
    Realiza upgrade de plano de assinatura
    ---
    Requer autenticação JWT
    Processa pagamento e atualiza assinatura
    """
    try:
        init_stripe()
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user:
            return jsonify({"error": "Usuário não encontrado"}), 404

        data = request.json

        if not data or 'plan_id' not in data:
            return jsonify({"error": "Dados incompletos"}), 400

        plan_id = data.get('plan_id')
        payment_method_id = data.get('payment_method_id')

        # Busca o plano
        plan = SubscriptionPlan.query.get(plan_id)
        if not plan or not plan.is_active:
            return jsonify({"error": "Plano não encontrado ou inativo"}), 404

        # Busca assinatura atual
        current_sub = Subscription.query.filter_by(
            user_id=user_id,
            status='active'
        ).first()

        # Se já estiver no mesmo plano, retorna erro
        if current_sub and current_sub.plan_id == plan_id:
            return jsonify({"error": "Usuário já possui este plano"}), 400

        # Processa o pagamento
        if payment_method_id:
            payment_result = process_payment(user, plan, payment_method_id)

            if not payment_result.get('success'):
                return jsonify({
                    "error": payment_result.get('error', 'Falha no processamento do pagamento')
                }), 400

            payment_id = payment_result.get('payment_id')
        else:
            # Upgrade sem pagamento só é permitido para planos gratuitos
            if plan.price > 0:
                return jsonify({"error": "Método de pagamento necessário para este plano"}), 400

            payment_id = None

        # Cria ou atualiza assinatura
        if current_sub:
            # Guarda tokens não utilizados para transferir
            remaining_tokens = current_sub.tokens_remaining
            remaining_messages = current_sub.messages_remaining

            # Finaliza assinatura atual
            current_sub.status = 'canceled'
            current_sub.end_date = datetime.utcnow()
            current_sub.updated_at = datetime.utcnow()
        else:
            remaining_tokens = 0
            remaining_messages = 0

        # Cria nova assinatura
        new_subscription = Subscription(
            user_id=user_id,
            plan_id=plan_id,
            status='active',
            start_date=datetime.utcnow(),
            end_date=datetime.utcnow() + timedelta(days=30),  # 30 dias de duração
            auto_renew=True,
            tokens_total=plan.tokens_per_month + remaining_tokens,
            tokens_used=0,
            tokens_remaining=plan.tokens_per_month + remaining_tokens,
            messages_total=plan.messages_per_month + remaining_messages,
            messages_used=0,
            messages_remaining=plan.messages_per_month + remaining_messages,
            payment_id=payment_id
        )

        db.session.add(new_subscription)
        db.session.commit()

        # Atualiza o nível do usuário
        user.subscription_level = plan.level
        db.session.commit()

        return jsonify({
            "success": True,
            "subscription": {
                "id": new_subscription.id,
                "plan_id": new_subscription.plan_id,
                "plan_name": plan.name,
                "start_date": new_subscription.start_date.isoformat(),
                "end_date": new_subscription.end_date.isoformat(),
                "tokens_remaining": new_subscription.tokens_remaining,
                "messages_remaining": new_subscription.messages_remaining
            }
        }), 200

    except Exception as e:
        logger.exception(f"Erro ao fazer upgrade de plano: {str(e)}")
        return jsonify({"error": f"Erro ao fazer upgrade de plano: {str(e)}"}), 500


@payment_bp.route('/tokens/add', methods=['POST'])
@jwt_required()
def purchase_tokens():
    """
    Compra tokens adicionais
    ---
    Requer autenticação JWT
    Processa pagamento e adiciona tokens à conta
    """
    try:
        init_stripe()
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user:
            return jsonify({"error": "Usuário não encontrado"}), 404

        data = request.json

        if not data or 'amount' not in data:
            return jsonify({"error": "Dados incompletos"}), 400

        token_amount = int(data.get('amount'))
        payment_method_id = data.get('payment_method_id')

        if token_amount <= 0:
            return jsonify({"error": "Quantidade de tokens inválida"}), 400

        # Calcula o preço baseado na quantidade
        price = calculate_token_price(token_amount)

        # Cria produto para tokens
        token_product = {
            "id": "token_package",
            "name": f"Pacote de {token_amount} tokens",
            "price": price
        }

        # Processa o pagamento
        if payment_method_id:
            payment_result = process_payment(
                user, token_product, payment_method_id)

            if not payment_result.get('success'):
                return jsonify({
                    "error": payment_result.get('error', 'Falha no processamento do pagamento')
                }), 400

            payment_id = payment_result.get('payment_id')
        else:
            return jsonify({"error": "Método de pagamento necessário"}), 400

        # Adiciona tokens à conta do usuário
        add_tokens_result = add_tokens(
            user_id, token_amount, f"Compra de {token_amount} tokens")

        if not add_tokens_result.get('success'):
            # Isso não deveria acontecer após o pagamento, é um erro crítico
            logger.critical(
                f"Falha ao adicionar tokens após pagamento: {add_tokens_result.get('error')}")
            return jsonify({"error": "Erro crítico ao adicionar tokens após pagamento"}), 500

        # Registra a transação
        transaction = Payment(
            user_id=user_id,
            amount=price,
            currency='BRL',
            type='token_purchase',
            status='completed',
            description=f"Compra de {token_amount} tokens",
            payment_method_id=payment_method_id,
            external_id=payment_result.get('transaction_id'),
            metadata=json.dumps({
                "tokens_purchased": token_amount,
                "price_per_token": price / token_amount
            })
        )

        db.session.add(transaction)
        db.session.commit()

        return jsonify({
            "success": True,
            "tokens_added": token_amount,
            "new_balance": add_tokens_result.get('new_balance'),
            "transaction_id": transaction.id
        }), 200

    except Exception as e:
        logger.exception(f"Erro ao comprar tokens: {str(e)}")
        return jsonify({"error": f"Erro ao comprar tokens: {str(e)}"}), 500


@payment_bp.route('/webhook', methods=['POST'])
def webhook():
    """
    Endpoint para webhooks do Stripe
    ---
    Processa eventos do Stripe como pagamentos, falhas, etc.
    """
    init_stripe()
    if not stripe_api_key or not stripe_webhook_secret:
        return jsonify({"error": "Stripe não configurado"}), 500

    payload = request.data
    sig_header = request.headers.get('Stripe-Signature')

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, stripe_webhook_secret
        )
    except ValueError as e:
        # Payload inválido
        logger.error(f"Webhook do Stripe com payload inválido: {str(e)}")
        return jsonify({"error": "Payload inválido"}), 400
    except stripe.error.SignatureVerificationError as e:
        # Assinatura inválida
        logger.error(f"Webhook do Stripe com assinatura inválida: {str(e)}")
        return jsonify({"error": "Assinatura inválida"}), 400

    # Processa o evento
    process_stripe_webhook_event(event)

    return jsonify({"success": True}), 200

# Funções auxiliares -------------------------------------------------


def process_payment(user, product, payment_method_id):
    """
    Processa um pagamento utilizando Stripe ou outro provedor

    Args:
        user: Objeto User do cliente
        product: Objeto com preço e detalhes do produto
        payment_method_id: ID do método de pagamento 

    Returns:
        Dicionário com resultado do pagamento
    """
    init_stripe()
    # Se for método do Stripe
    if stripe_api_key and payment_method_id.startswith('pm_'):
        try:
            # Verificar se o usuário tem um customer_id
            if not user.stripe_customer_id:
                customer = stripe.Customer.create(
                    email=user.email,
                    name=user.name,
                    payment_method=payment_method_id,
                    metadata={"user_id": user.id}
                )
                user.stripe_customer_id = customer.id
                db.session.commit()

            # Criar um PaymentIntent
            payment_intent = stripe.PaymentIntent.create(
                # Stripe trabalha com centavos
                amount=int(product.get('price') * 100),
                currency='brl',
                customer=user.stripe_customer_id,
                payment_method=payment_method_id,
                confirm=True,
                return_url=url_for('payment.payment_callback', _external=True),
                metadata={
                    "user_id": user.id,
                    "product_type": product.get('id', 'subscription'),
                    "product_name": product.get('name', 'Assinatura')
                }
            )

            # Processar resultado
            if payment_intent.status == 'succeeded':
                # Criar registro de pagamento local
                payment = Payment(
                    user_id=user.id,
                    amount=product.get('price'),
                    currency='BRL',
                    type='subscription' if product.get(
                        'id') == 'subscription' else 'token_purchase',
                    status='completed',
                    description=f"Pagamento de {product.get('name')}",
                    payment_method_id=payment_method_id,
                    external_id=payment_intent.id
                )

                db.session.add(payment)
                db.session.commit()

                return {
                    "success": True,
                    "payment_id": payment.id,
                    "transaction_id": payment_intent.id
                }
            elif payment_intent.status == 'requires_action':
                # Cliente precisa autenticar
                return {
                    "success": False,
                    "requires_action": True,
                    "payment_intent_client_secret": payment_intent.client_secret,
                    "error": "Pagamento requer autenticação adicional"
                }
            else:
                return {
                    "success": False,
                    "error": f"Falha no pagamento: {payment_intent.status}"
                }

        except stripe.error.CardError as e:
            # Erro no cartão do cliente
            return {
                "success": False,
                "error": f"Erro no cartão: {e.error.message}"
            }
        except stripe.error.StripeError as e:
            # Outros erros do Stripe
            logger.error(f"Erro do Stripe ao processar pagamento: {str(e)}")
            return {
                "success": False,
                "error": f"Erro no processamento: {str(e)}"
            }

    # Se for método local (mock)
    else:
        try:
            # Verifica se o método existe
            payment_method = PaymentMethod.query.filter_by(
                id=payment_method_id,
                user_id=user.id,
                is_deleted=False
            ).first()

            if not payment_method:
                return {
                    "success": False,
                    "error": "Método de pagamento não encontrado"
                }

            # Simula um pagamento bem-sucedido (em produção, chamaria um gateway)
            payment = Payment(
                user_id=user.id,
                amount=product.get('price'),
                currency='BRL',
                type='subscription' if product.get(
                    'id', '').startswith('plan_') else 'token_purchase',
                status='completed',
                description=f"Pagamento de {product.get('name')}",
                payment_method_id=payment_method_id,
                external_id=f"sim_{datetime.utcnow().timestamp()}"
            )

            db.session.add(payment)
            db.session.commit()

            return {
                "success": True,
                "payment_id": payment.id,
                "transaction_id": payment.external_id
            }

        except Exception as e:
            logger.error(f"Erro ao processar pagamento local: {str(e)}")
            return {
                "success": False,
                "error": f"Erro no processamento: {str(e)}"
            }


def calculate_token_price(amount):
    """
    Calcula o preço para uma quantidade de tokens

    Args:
        amount: Quantidade de tokens

    Returns:
        Preço em reais
    """
    # Preço base por token
    base_price = 0.02

    # Desconto por volume
    if amount >= 50000:
        discount = 0.25  # 25% de desconto
    elif amount >= 25000:
        discount = 0.20  # 20% de desconto
    elif amount >= 10000:
        discount = 0.15  # 15% de desconto
    elif amount >= 5000:
        discount = 0.10  # 10% de desconto
    elif amount >= 2000:
        discount = 0.05  # 5% de desconto
    else:
        discount = 0

    # Calcular preço final
    total_price = amount * base_price * (1 - discount)

    # Arredondar para 2 casas decimais
    return round(total_price, 2)


def process_stripe_webhook_event(event):
    """
    Processa evento do webhook do Stripe

    Args:
        event: Objeto de evento do Stripe
    """
    init_stripe()
    try:
        event_type = event['type']
        data = event['data']['object']

        if event_type == 'payment_intent.succeeded':
            # Pagamento bem-sucedido
            payment_intent = data
            user_id = payment_intent.get('metadata', {}).get('user_id')

            if not user_id:
                logger.error(
                    f"Payment Intent sem user_id no metadata: {payment_intent.id}")
                return

            # Verificar se já foi processado (idempotência)
            existing_payment = Payment.query.filter_by(
                external_id=payment_intent.id).first()
            if existing_payment:
                if existing_payment.status != 'completed':
                    existing_payment.status = 'completed'
                    db.session.commit()
                return

            # Criar novo registro de pagamento
            payment = Payment(
                user_id=user_id,
                amount=payment_intent.amount / 100,  # Converter de centavos
                currency=payment_intent.currency.upper(),
                type=payment_intent.get('metadata', {}).get(
                    'product_type', 'unknown'),
                status='completed',
                description=f"Pagamento via Stripe: {payment_intent.get('metadata', {}).get('product_name', 'Produto')}",
                payment_method_id=payment_intent.payment_method,
                external_id=payment_intent.id
            )

            db.session.add(payment)
            db.session.commit()

        elif event_type == 'payment_intent.payment_failed':
            # Pagamento falhou
            payment_intent = data
            user_id = payment_intent.get('metadata', {}).get('user_id')

            if not user_id:
                logger.error(
                    f"Payment Intent sem user_id no metadata: {payment_intent.id}")
                return

            # Verificar se já existe um registro
            existing_payment = Payment.query.filter_by(
                external_id=payment_intent.id).first()
            if existing_payment:
                existing_payment.status = 'failed'
                existing_payment.error_message = payment_intent.get(
                    'last_payment_error', {}).get('message', 'Falha no pagamento')
                db.session.commit()
            else:
                # Criar registro de falha
                payment = Payment(
                    user_id=user_id,
                    amount=payment_intent.amount / 100,
                    currency=payment_intent.currency.upper(),
                    type=payment_intent.get('metadata', {}).get(
                        'product_type', 'unknown'),
                    status='failed',
                    description=f"Falha no pagamento via Stripe: {payment_intent.get('metadata', {}).get('product_name', 'Produto')}",
                    payment_method_id=payment_intent.payment_method,
                    external_id=payment_intent.id,
                    error_message=payment_intent.get('last_payment_error', {}).get(
                        'message', 'Falha no pagamento')
                )

                db.session.add(payment)
                db.session.commit()

        elif event_type == 'customer.subscription.created' or event_type == 'customer.subscription.updated':
            # Assinatura criada ou atualizada
            subscription = data
            customer_id = subscription.customer

            user = User.query.filter_by(stripe_customer_id=customer_id).first()
            if not user:
                logger.error(
                    f"Subscription webhook: usuário não encontrado para customer_id {customer_id}")
                return

            # Buscar plano associado
            stripe_price_id = subscription.items.data[0].price.id if subscription.items.data else None
            plan = SubscriptionPlan.query.filter_by(
                stripe_price_id=stripe_price_id).first()

            if not plan:
                logger.error(
                    f"Plano não encontrado para stripe_price_id {stripe_price_id}")
                return

            # Buscar assinatura atual
            current_sub = Subscription.query.filter_by(
                user_id=user.id,
                status='active'
            ).first()

            # Atualizar ou criar assinatura
            if current_sub:
                # Atualizar assinatura existente
                current_sub.plan_id = plan.id
                current_sub.external_id = subscription.id
                current_sub.status = 'active' if subscription.status == 'active' else 'inactive'
                current_sub.end_date = datetime.fromtimestamp(
                    subscription.current_period_end)
                current_sub.auto_renew = subscription.cancel_at_period_end == False
                current_sub.updated_at = datetime.utcnow()
            else:
                # Criar nova assinatura
                new_sub = Subscription(
                    user_id=user.id,
                    plan_id=plan.id,
                    external_id=subscription.id,
                    status='active' if subscription.status == 'active' else 'inactive',
                    start_date=datetime.fromtimestamp(
                        subscription.current_period_start),
                    end_date=datetime.fromtimestamp(
                        subscription.current_period_end),
                    auto_renew=subscription.cancel_at_period_end == False,
                    tokens_total=plan.tokens_per_month,
                    tokens_used=0,
                    tokens_remaining=plan.tokens_per_month,
                    messages_total=plan.messages_per_month,
                    messages_used=0,
                    messages_remaining=plan.messages_per_month
                )

                db.session.add(new_sub)

            # Atualizar nível do usuário
            user.subscription_level = plan.level
            db.session.commit()

        elif event_type == 'customer.subscription.deleted':
            # Assinatura foi cancelada
            subscription = data
            customer_id = subscription.customer

            user = User.query.filter_by(stripe_customer_id=customer_id).first()
            if not user:
                logger.error(
                    f"Subscription deleted webhook: usuário não encontrado para customer_id {customer_id}")
                return

            # Buscar assinatura
            sub = Subscription.query.filter_by(
                user_id=user.id,
                external_id=subscription.id,
                status='active'
            ).first()

            if sub:
                sub.status = 'canceled'
                sub.updated_at = datetime.utcnow()
                db.session.commit()

            # Rebaixar nível do usuário para free
            user.subscription_level = 'free'
            db.session.commit()

    except Exception as e:
        logger.exception(f"Erro ao processar webhook do Stripe: {str(e)}")


@payment_bp.route('/callback', methods=['GET'])
def payment_callback():
    """
    Endpoint de retorno após pagamento no Stripe
    """
    init_stripe()
    # Analisa parâmetros da URL
    payment_intent_id = request.args.get('payment_intent')
    redirect_status = request.args.get('redirect_status')

    if not payment_intent_id:
        return jsonify({"error": "Parâmetros inválidos"}), 400

    # Verifica status do pagamento
    payment = Payment.query.filter_by(external_id=payment_intent_id).first()

    if payment:
        if redirect_status == 'succeeded' and payment.status != 'completed':
            payment.status = 'completed'
            db.session.commit()

        # Retorna página HTML com resultado
        if payment.status == 'completed':
            return f"""
            <html>
                <head><title>Pagamento Concluído</title></head>
                <body>
                    <h1>Pagamento processado com sucesso!</h1>
                    <p>Seu pagamento foi concluído e sua compra está disponível.</p>
                    <p><a href="/">Voltar para a aplicação</a></p>
                    <script>
                        // Fecha esta janela e volta para a aplicação após 5 segundos
                        setTimeout(function() {{
                            window.close();
                        }}, 5000);
                    </script>
                </body>
            </html>
            """
        else:
            return f"""
            <html>
                <head><title>Verificando Pagamento</title></head>
                <body>
                    <h1>Estamos processando seu pagamento</h1>
                    <p>Por favor, aguarde enquanto verificamos o status do seu pagamento.</p>
                    <p><a href="/">Voltar para a aplicação</a></p>
                </body>
            </html>
            """
    else:
        return f"""
        <html>
            <head><title>Pagamento não Encontrado</title></head>
            <body>
                <h1>Não conseguimos identificar seu pagamento</h1>
                <p>Não se preocupe, se o pagamento foi realizado com sucesso, ele será processado automaticamente.</p>
                <p><a href="/">Voltar para a aplicação</a></p>
            </body>
        </html>
        """
