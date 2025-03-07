import React from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/Home.module.css';

export default function Home() {
  const router = useRouter();

  const handleLogin = () => {
    // Redirecionar para a página de login do Keycloak ou outra página
    router.push('/dashboard');
  };

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.title}>Bem-vindo ao AdamChat</h1>
        
        <p className={styles.description}>
          Faça login para acessar sua conta
        </p>

        <div className={styles.grid}>
          <button 
            onClick={handleLogin} 
            className={styles.loginButton}
          >
            Entrar
          </button>
        </div>
      </main>
    </div>
  );
} 