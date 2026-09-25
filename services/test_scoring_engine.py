import unittest

from scoring_engine import LocalRulesProvider, ScorePipeline, Segment, make_window


SEGMENTS = [
    Segment("seg-1", "08:42", "The interface between a model and a team is becoming the product."),
    Segment("seg-2", "08:55", "When the system can retrieve context, the workflow changes to delegating outcomes."),
    Segment("seg-3", "09:17", "We saw a 42 percent reduction in time-to-resolution across partners."),
]


class ScoringEngineTest(unittest.TestCase):
    def test_window_and_numeric_claim_confidence(self):
        window = make_window(SEGMENTS, SEGMENTS[-1].milliseconds)
        self.assertEqual([segment.id for segment in window.segments], ["seg-2", "seg-3"])
        decision = LocalRulesProvider().analyze(window, SEGMENTS)
        self.assertLess(decision.confidence["trust"], decision.confidence["wisdom"])
        self.assertEqual(decision.reasons["trust"]["code"], "UNVERIFIED_NUMERIC_CLAIM")

    def test_failed_provider_keeps_last_stable_snapshot(self):
        provider = LocalRulesProvider()
        pipeline = ScorePipeline(provider)
        first, _ = pipeline.process(make_window(SEGMENTS, SEGMENTS[0].milliseconds), SEGMENTS)

        class Offline:
            def analyze(self, window, context):
                raise RuntimeError("offline")

        pipeline.provider = Offline()
        stale, changes = pipeline.process(make_window(SEGMENTS, SEGMENTS[1].milliseconds), SEGMENTS)
        self.assertTrue(stale.stale)
        self.assertEqual(stale.smoothed, first.smoothed)
        self.assertEqual(changes, [])

    def test_transcript_confidence_reduces_decision_confidence(self):
        provider = LocalRulesProvider()
        strong = provider.analyze(make_window(SEGMENTS, SEGMENTS[0].milliseconds), SEGMENTS)
        weak_segments = [Segment("weak", "08:42", SEGMENTS[0].text, .4)]
        weak = provider.analyze(make_window(weak_segments, weak_segments[0].milliseconds), weak_segments)
        self.assertLess(weak.confidence["wisdom"], strong.confidence["wisdom"])


if __name__ == "__main__":
    unittest.main()
