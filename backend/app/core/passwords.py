"""Hash y verificación de contraseñas con bcrypt.

Módulo sin dependencias de configuración (JWT, base de datos) para que los
scripts de administración puedan usar exactamente el mismo hash que el login.
"""
import bcrypt


# bcrypt acepta máximo 72 bytes de password: truncamos como recomienda upstream.
def _bcrypt_safe_pw(password: str) -> bytes:
    return password.encode("utf-8")[:72]


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(_bcrypt_safe_pw(plain), hashed.encode("utf-8"))
    except Exception:  # noqa: BLE001 - hash inválido / corrupto
        return False


def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(_bcrypt_safe_pw(password), bcrypt.gensalt()).decode("utf-8")
