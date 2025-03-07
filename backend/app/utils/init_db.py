from app.extensions import db
from flask import current_app
import logging

logger = logging.getLogger(__name__)


def seed_db():
    """
    Seed the database with initial data.
    This function is called during app initialization in development mode.
    """
    try:
        logger.info("Checking if database needs seeding...")
        # Add your seeding logic here if needed
        # For example:
        # if User.query.count() == 0:
        #     admin = User(username='admin', email='admin@example.com')
        #     admin.set_password('password')
        #     db.session.add(admin)
        #     db.session.commit()
        #     logger.info("Added admin user")

        logger.info("Database seeding completed or not needed")
    except Exception as e:
        logger.error(f"Error seeding database: {str(e)}")
        # Don't raise the exception, just log it
        # We don't want the app to crash if seeding fails
