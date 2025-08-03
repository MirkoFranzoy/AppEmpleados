'use client';

import { useState, useEffect } from 'react'; 
import { auth, provider, signInWithPopup } from '../firebase';
import styles from '../page.module.css';
import { useRouter } from 'next/navigation';
import { limpiarSesion } from '../utils/fetchInterceptor';

export default function LoginPage() {
    const router = useRouter();
    
    // Limpiar la sesión al cargar la página de login
    useEffect(() => {
        limpiarSesion();
    }, []);
    
    const handleGoogleLogin = () => {
        signInWithPopup(auth, provider)
            .then((result) => {
                // Obtener el token y guardarlo en localStorage
                result.user?.getIdToken().then(idToken => {
                    localStorage.setItem('authToken', idToken);
                    // Guardar información básica del usuario
                    localStorage.setItem('user', JSON.stringify({
                        email: result.user?.email,
                        uid: result.user?.uid
                    }));
                    // Redirigir al usuario a la página de empleados después del login
                    router.push('/empleados');
                });
            })
            .catch((error) => {
                console.error('Error de autenticación:', error);
                alert('Error al iniciar sesión con Google');
            });
    };

    return (
        <div className={styles.loginContainer}>
            <h1>Bienvenido al Sistema de Empleados</h1>
            <button className={styles.googleBtn} onClick={handleGoogleLogin}>
                <img src="https://www.google.com/favicon.ico" alt="Google" width="20" height="20" />{' '}
                Iniciar sesión con Google
            </button>
        </div>
    );
}