from flask import Blueprint, render_template, make_response

dashboard_bp = Blueprint("dashboard_bp", __name__)

@dashboard_bp.route("/dashboard")
def dashboard():
    response = make_response(render_template("dashboard.html"))
    response.headers["Content-Type"] = "text/html; charset=utf-8"
    return response
