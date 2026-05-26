"""
base.py
~~~~~~~
Abstract base class that every marketplace publisher must implement.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional

# Forward-import to avoid circular imports at runtime
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from app.models.vehicle import Vehicle


@dataclass
class PublishResult:
    """Uniform result returned by every marketplace publish / update / remove call."""

    success: bool
    listing_id: Optional[str] = None
    status: str = "draft"
    message: str = ""
    error: Optional[str] = None
    raw_response: dict = field(default_factory=dict)


class BaseMarketplacePublisher(ABC):
    """Abstract base class for all marketplace publishers.

    Subclasses must implement:
      - publish_vehicle  — create a new listing
      - update_vehicle   — update an existing listing
      - remove_vehicle   — end / withdraw a listing
    """

    @abstractmethod
    async def publish_vehicle(self, vehicle: "Vehicle") -> PublishResult:
        """Create a new listing for *vehicle* on the marketplace."""
        ...

    @abstractmethod
    async def update_vehicle(self, vehicle: "Vehicle") -> PublishResult:
        """Update the existing listing for *vehicle*."""
        ...

    @abstractmethod
    async def remove_vehicle(self, vehicle: "Vehicle") -> PublishResult:
        """End / withdraw the listing for *vehicle* from the marketplace."""
        ...
