import base64
import json
import logging
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field
from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from langchain_core.tools import StructuredTool

from app.models.vehicle import FuelType, Vehicle, VehicleStatus

logger = logging.getLogger(__name__)

# Maps normalised user term → SQL filter hint
_TYPE_MAP: dict[str, dict] = {
    "suv":         {"body": "SUV"},
    "sedan":       {"body": "Sedan"},
    "truck":       {"body": "Truck"},
    "pickup":      {"body": "Truck"},
    "electric":    {"fuel": FuelType.electric},
    "hybrid":      {"fuel": FuelType.hybrid},
    "plugin":      {"fuel": FuelType.plug_in_hybrid},
    "coupe":       {"body": "Coupe"},
    "convertible": {"body": "Convertible"},
    "van":         {"body": "Van"},
    "minivan":     {"body": "Minivan"},
    "hatchback":   {"body": "Hatchback"},
    "wagon":       {"body": "Wagon"},
    "crossover":   {"body": "Crossover"},
    "luxury":      {"body": "Luxury"},
}


def _fmt_price(v: Vehicle) -> str:
    return "Call for price" if v.price_on_call else f"${float(v.price):,.0f}"


# ── Schema classes ──────────────────────────────────────────────────────────

class SearchInventoryInput(BaseModel):
    vehicle_type: str = Field(
        description=(
            'Vehicle category. One of: suv, sedan, truck, electric, hybrid, '
            'coupe, convertible, van, minivan, hatchback, wagon. '
            'Use "all" to browse without a type filter.'
        )
    )
    make: Optional[str] = Field(None, description="Manufacturer filter, e.g. Toyota, Honda, Ford")
    max_price: Optional[float] = Field(None, description="Maximum price in dollars")
    mileage_max: Optional[int] = Field(None, description="Maximum mileage")


class GetVehicleDetailsInput(BaseModel):
    make: str = Field(description="Manufacturer, e.g. Toyota, Honda, Ford")
    model: str = Field(description="Model name, e.g. Camry, Civic, F-150")
    year: Optional[int] = Field(None, description="Model year (optional)")


# ── Tool factories ──────────────────────────────────────────────────────────

def make_search_inventory_tool(db: AsyncSession) -> StructuredTool:
    async def search_inventory(
        vehicle_type: str,
        make: Optional[str] = None,
        max_price: Optional[float] = None,
        mileage_max: Optional[int] = None,
    ) -> str:
        logger.info(
            "[tool:search_inventory] type=%s make=%s max_price=%s mileage_max=%s",
            vehicle_type, make, max_price, mileage_max,
        )
        key = vehicle_type.lower().rstrip("s").replace("-", "").replace(" ", "")
        hint = _TYPE_MAP.get(key, {})

        conditions: list = [Vehicle.status == VehicleStatus.available]

        body = hint.get("body")
        fuel = hint.get("fuel")
        if body:
            conditions.append(
                or_(
                    Vehicle.body_type.ilike(f"%{body}%"),
                    Vehicle.title.ilike(f"%{body}%"),
                )
            )
        elif fuel:
            conditions.append(Vehicle.fuel_type == fuel)
        elif vehicle_type.lower() not in ("all", "any", ""):
            # Unknown type — broad text search so we still return something useful
            conditions.append(
                or_(
                    Vehicle.title.ilike(f"%{vehicle_type}%"),
                    Vehicle.body_type.ilike(f"%{vehicle_type}%"),
                    Vehicle.make.ilike(f"%{vehicle_type}%"),
                )
            )

        if make:
            conditions.append(Vehicle.make.ilike(f"%{make}%"))
        if max_price is not None:
            conditions.append(Vehicle.price <= Decimal(str(max_price)))
        if mileage_max is not None:
            conditions.append(Vehicle.mileage <= mileage_max)

        try:
            result = await db.execute(
                select(Vehicle)
                .where(and_(*conditions))
                .order_by(Vehicle.featured.desc(), Vehicle.created_at.desc())
                .limit(6)
            )
            vehicles = result.scalars().all()
        except Exception as exc:
            logger.error("[tool:search_inventory] db error: %s", exc)
            return "I'm having trouble reaching our inventory system right now. Can I have someone call you instead?"

        if not vehicles:
            suffix = f" under ${max_price:,.0f}" if max_price else ""
            return (
                f"We don't have any {vehicle_type}s in stock right now{suffix}. "
                "I can notify you when one arrives — would you like to leave your contact info?"
            )

        vehicle_dicts = [
            {
                "id": str(v.id),
                "title": v.title,
                "make": v.make,
                "model": v.model,
                "year": v.year,
                "price": float(v.price) if not v.price_on_call else None,
                "price_on_call": v.price_on_call,
                "mileage": v.mileage,
                "images": v.images or [],
                "stock_number": v.stock_number,
                "color": v.color,
                "body_type": v.body_type,
            }
            for v in vehicles
        ]
        vehicles_b64 = base64.b64encode(json.dumps(vehicle_dicts).encode()).decode()

        lines = [
            f"• {v.year} {v.make} {v.model}"
            + (f" ({v.color})" if v.color else "")
            + f" — {_fmt_price(v)} | {v.mileage:,} mi"
            for v in vehicles
        ]
        return (
            f"Found {len(vehicles)} available {vehicle_type}s:\n"
            + "\n".join(lines)
            + f"\n[VEHICLES:{vehicles_b64}]"
        )

    return StructuredTool.from_function(
        coroutine=search_inventory,
        name="search_inventory",
        description=(
            "Browse real available inventory filtered by vehicle type, make, price, or mileage. "
            "Always use this tool to get inventory — never invent or guess vehicle listings."
        ),
        args_schema=SearchInventoryInput,
    )


def make_get_vehicle_details_tool(db: AsyncSession) -> StructuredTool:
    async def get_vehicle_details(
        make: str,
        model: str,
        year: Optional[int] = None,
    ) -> str:
        logger.info("[tool:get_vehicle_details] make=%s model=%s year=%s", make, model, year)
        conditions: list = [
            Vehicle.make.ilike(f"%{make}%"),
            Vehicle.model.ilike(f"%{model}%"),
            Vehicle.status == VehicleStatus.available,
        ]
        if year:
            conditions.append(Vehicle.year == year)

        try:
            result = await db.execute(
                select(Vehicle).where(and_(*conditions)).limit(5)
            )
            vehicles = result.scalars().all()
        except Exception as exc:
            logger.error("[tool:get_vehicle_details] db error: %s", exc)
            return "I'm having trouble reaching our inventory system right now. Can I have someone call you instead?"

        if not vehicles:
            prefix = f"{year} " if year else ""
            return (
                f"We don't currently have a {prefix}{make} {model} in stock. "
                "I can check similar options or have someone contact you — which would you prefer?"
            )

        v = vehicles[0]
        price = _fmt_price(v)
        features = ", ".join((v.features or [])[:4]) or "Contact us for the full feature list"

        parts = [
            f"The {v.title} is priced at {price} with {v.mileage:,} miles"
            f" and is currently {v.status.value}."
        ]
        if v.engine:
            parts.append(f"Engine: {v.engine}.")
        if v.color:
            parts.append(f"Colour: {v.color}.")
        if v.transmission:
            parts.append(f"Transmission: {v.transmission.value}.")
        if v.fuel_type:
            parts.append(f"Fuel type: {v.fuel_type.value}.")
        parts.append(f"Key features: {features}.")

        return " ".join(parts)

    return StructuredTool.from_function(
        coroutine=get_vehicle_details,
        name="get_vehicle_details",
        description=(
            "Look up a specific vehicle by make and model from real inventory. "
            "Returns price, mileage, features, and availability. "
            "Call this when a customer asks about a particular car."
        ),
        args_schema=GetVehicleDetailsInput,
    )
