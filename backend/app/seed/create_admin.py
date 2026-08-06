"""Create the first admin user.

    uv run python -m app.seed.create_admin admin@renesola.pk "Strong Password" "Admin Name"

Re-running with an existing email resets that user's password instead of erroring.
"""

import sys

from sqlalchemy import select

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.user import User, UserRole


def main() -> int:
    if len(sys.argv) < 3:
        print(__doc__)
        return 1

    email = sys.argv[1].lower().strip()
    password = sys.argv[2]
    name = sys.argv[3] if len(sys.argv) > 3 else "Administrator"

    if len(password) < 10:
        print("Password must be at least 10 characters.")
        return 1

    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.email == email))
        if user:
            user.hashed_password = hash_password(password)
            user.is_active = True
            db.commit()
            print(f"Password reset for existing user: {email}")
            return 0

        db.add(
            User(
                email=email,
                hashed_password=hash_password(password),
                name=name,
                role=UserRole.ADMIN,
                is_active=True,
            )
        )
        db.commit()
        print(f"Admin created: {email}")
        return 0


if __name__ == "__main__":
    raise SystemExit(main())
