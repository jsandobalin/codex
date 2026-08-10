import json
import subprocess
import unittest
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SCRIPT = PROJECT_ROOT / 'scripts' / 'list-signals.py'


def run_script(*arguments):
    return subprocess.run(
        ['python3', str(SCRIPT), *arguments],
        capture_output=True,
        check=False,
        encoding='utf-8',
    )


class ListSignalsTest(unittest.TestCase):
    def test_returns_count_in_snapshot_order(self):
        result = run_script('--day', '2026-08-09', '--count', '2')

        self.assertEqual(result.returncode, 0)
        payload = json.loads(result.stdout)
        self.assertEqual(payload['date'], '2026-08-09')
        self.assertEqual(payload['order'], 'snapshot')
        self.assertEqual(payload['requestedCount'], 2)
        self.assertEqual(payload['returnedCount'], 2)
        self.assertEqual(
            [signal['id'] for signal in payload['signals']],
            [
                '2026-08-06-openai-apa-youth-ai',
                '2026-07-30-gpt-56-price-performance',
            ],
        )

    def test_orders_by_impact(self):
        result = run_script('--day', '2026-08-09', '--order', 'impact-desc')

        self.assertEqual(result.returncode, 0)
        payload = json.loads(result.stdout)
        self.assertEqual(
            [signal['impact']['level'] for signal in payload['signals']],
            ['high', 'high', 'high', 'medium-high', 'medium-high'],
        )

    def test_returns_json_error_for_missing_snapshot(self):
        result = run_script('--day', '2026-08-08')

        self.assertEqual(result.returncode, 1)
        self.assertEqual(result.stdout, '')
        self.assertEqual(
            json.loads(result.stderr),
            {'error': 'No snapshot found for 2026-08-08.'},
        )


if __name__ == '__main__':
    unittest.main()
