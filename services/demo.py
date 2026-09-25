"""Print a deterministic snapshot from a small transcript fixture."""
import json

from scoring_engine import LocalRulesProvider, Segment, ScorePipeline, make_window, snapshot_json


segments = [
    Segment("seg-141", "08:42", "The interface between a model and a team is becoming the product."),
    Segment("seg-142", "08:55", "When the system can observe intent, retrieve context, and take a bounded action, the workflow changes."),
    Segment("seg-143", "09:17", "We saw a 42 percent reduction in time-to-resolution across the first three design partners."),
]
pipeline = ScorePipeline(LocalRulesProvider())
snapshot, changes = pipeline.process(make_window(segments, segments[-1].milliseconds), segments)
print(json.dumps({"snapshot": snapshot_json(snapshot), "changes": [change.__dict__ for change in changes]}, indent=2))
