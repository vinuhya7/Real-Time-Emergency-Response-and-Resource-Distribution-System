from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Optional

@dataclass
class Incident:
    id: int
    title: str
    incident_type: str
    location: str
    severity: int
    status: str
    created_at: str
    assigned_resource_id: Optional[int] = None

    def priority_score(self) -> float:
        """Higher severity and longer waiting time produce a higher priority."""
        try:
            created = datetime.fromisoformat(self.created_at)
            if created.tzinfo is None:
                created = created.replace(tzinfo=timezone.utc)
            waiting_minutes = max(0, (datetime.now(timezone.utc) - created).total_seconds() / 60)
        except (ValueError, TypeError):
            waiting_minutes = 0
        return self.severity * 100 + min(waiting_minutes, 999)

@dataclass
class Resource:
    id: int
    name: str
    resource_type: str
    location: str
    available: bool = True
