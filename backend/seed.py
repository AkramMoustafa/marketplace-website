"""
Run: python seed.py
Seeds the database with an admin user and sample vehicles.
"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import AsyncSessionLocal
from app.models.user import User, UserRole
from app.models.vehicle import Vehicle, TransmissionType, FuelType, VehicleStatus
from app.auth.password import hash_password
from app.config.settings import get_settings

settings = get_settings()

SAMPLE_VEHICLES = [
    {
        "title": "2023 BMW M3 Competition",
        "make": "BMW", "model": "M3", "year": 2023, "mileage": 5200,
        "price": 89500, "transmission": TransmissionType.automatic,
        "fuel_type": FuelType.gasoline, "vin": "WBS8M9C52P5A00001",
        "color": "Frozen Portimao Blue", "body_type": "Sedan",
        "featured": True, "description": "Factory M-Sport package, carbon fiber roof, HUD.",
    },
    {
        "title": "2022 Mercedes-Benz S-Class S500",
        "make": "Mercedes-Benz", "model": "S-Class", "year": 2022, "mileage": 18700,
        "price": 112000, "transmission": TransmissionType.automatic,
        "fuel_type": FuelType.gasoline, "vin": "W1K6G7GB4NA000002",
        "color": "Obsidian Black", "body_type": "Sedan",
        "featured": True, "description": "Executive rear seat, Burmester 4D audio, Energizing package.",
    },
    {
        "title": "2023 Tesla Model S Plaid",
        "make": "Tesla", "model": "Model S", "year": 2023, "mileage": 3100,
        "price": 135000, "transmission": TransmissionType.automatic,
        "fuel_type": FuelType.electric, "vin": "5YJSA1E6XPF000003",
        "color": "Pearl White", "body_type": "Sedan",
        "featured": True, "description": "Tri-motor, 1020 hp, 0-60 in 1.99s, Full Self-Driving.",
    },
    {
        "title": "2021 Porsche 911 Carrera S",
        "make": "Porsche", "model": "911", "year": 2021, "mileage": 22000,
        "price": 142000, "transmission": TransmissionType.dct,
        "fuel_type": FuelType.gasoline, "vin": "WP0AB2A99MS000004",
        "color": "GT Silver Metallic", "body_type": "Coupe",
        "featured": False, "description": "Sport Chrono, PASM, Bose Surround Sound.",
    },
    {
        "title": "2022 Range Rover Autobiography",
        "make": "Land Rover", "model": "Range Rover", "year": 2022, "mileage": 14500,
        "price": 189000, "transmission": TransmissionType.automatic,
        "fuel_type": FuelType.hybrid, "vin": "SALGA2FU5LA000005",
        "color": "Santorini Black", "body_type": "SUV",
        "featured": True, "description": "Long wheelbase, massage seats, SV Bespoke interior.",
    },
    {
        "title": "2023 Audi RS7 Sportback",
        "make": "Audi", "model": "RS7", "year": 2023, "mileage": 7800,
        "price": 127500, "transmission": TransmissionType.automatic,
        "fuel_type": FuelType.gasoline, "vin": "WUAPBAF26PN000006",
        "color": "Nardo Gray", "body_type": "Fastback",
        "featured": True, "description": "600 hp twin-turbo V8, RS Sport exhaust, carbon optics.",
    },
]


async def seed():
    async with AsyncSessionLocal() as db:
        # Admin
        from sqlalchemy import select
        existing = await db.execute(select(User).where(User.email == settings.ADMIN_EMAIL))
        if not existing.scalar_one_or_none():
            admin = User(
                name=settings.ADMIN_NAME,
                email=settings.ADMIN_EMAIL,
                hashed_password=hash_password(settings.ADMIN_PASSWORD),
                role=UserRole.admin,
            )
            db.add(admin)
            await db.flush()
            print(f"Created admin: {settings.ADMIN_EMAIL}")
        else:
            result = await db.execute(select(User).where(User.email == settings.ADMIN_EMAIL))
            admin = result.scalar_one()
            print(f"Admin already exists: {settings.ADMIN_EMAIL}")

        # Vehicles
        for v_data in SAMPLE_VEHICLES:
            vin_check = await db.execute(select(Vehicle).where(Vehicle.vin == v_data["vin"]))
            if not vin_check.scalar_one_or_none():
                vehicle = Vehicle(**v_data, created_by=admin.id, images=[], status=VehicleStatus.available)
                db.add(vehicle)
                print(f"Created vehicle: {v_data['title']}")
            else:
                print(f"Vehicle exists: {v_data['title']}")

        await db.commit()
        print("\nSeed complete.")


if __name__ == "__main__":
    asyncio.run(seed())
