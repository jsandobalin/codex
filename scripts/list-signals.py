#!/usr/bin/env python3
"""List saved AI Radar daily signals as JSON."""

import argparse
import json
import sys
from datetime import date
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SNAPSHOT_DIRECTORY = PROJECT_ROOT / 'snapshots' / 'daily'
IMPACT_LEVELS = {
    'low': 1,
    'medium': 2,
    'medium-high': 3,
    'high': 4,
}
ORDERS = (
    'snapshot',
    'published-desc',
    'published-asc',
    'impact-desc',
    'impact-asc',
    'title-asc',
    'title-desc',
)


class SignalQueryError(Exception):
    """Describe an expected error while reading a local snapshot."""


def parse_day(value):
    try:
        return date.fromisoformat(value).isoformat()
    except ValueError as error:
        raise argparse.ArgumentTypeError('day must use YYYY-MM-DD format') from error


def positive_integer(value):
    try:
        number = int(value)
    except ValueError as error:
        raise argparse.ArgumentTypeError('count must be a positive integer') from error

    if number < 1:
        raise argparse.ArgumentTypeError('count must be a positive integer')
    return number


def parse_arguments(arguments=None):
    parser = argparse.ArgumentParser(
        description='Return saved AI Radar daily signals as JSON.'
    )
    parser.add_argument(
        '--day',
        type=parse_day,
        default=date.today().isoformat(),
        help='Snapshot day in YYYY-MM-DD format (default: today).',
    )
    parser.add_argument(
        '--count',
        '-n',
        type=positive_integer,
        default=5,
        help='Maximum number of signals to return (default: 5).',
    )
    parser.add_argument(
        '--order',
        choices=ORDERS,
        default='snapshot',
        help='Ordering for the returned signals (default: snapshot).',
    )
    return parser.parse_args(arguments)


def load_snapshot(day):
    path = SNAPSHOT_DIRECTORY / f'{day}-ai-signals.json'
    if not path.is_file():
        raise SignalQueryError(f'No snapshot found for {day}.')

    try:
        with path.open(encoding='utf-8') as snapshot_file:
            snapshot = json.load(snapshot_file)
    except json.JSONDecodeError as error:
        raise SignalQueryError(f'Snapshot for {day} contains invalid JSON.') from error

    if not isinstance(snapshot, dict) or not isinstance(snapshot.get('signals'), list):
        raise SignalQueryError(f'Snapshot for {day} does not contain a signals array.')
    return snapshot


def order_signals(signals, order):
    if order == 'snapshot':
        return list(signals)
    if order.startswith('published'):
        return sorted(
            signals,
            key=lambda signal: signal.get('source', {}).get('publishedAt', ''),
            reverse=order == 'published-desc',
        )
    if order.startswith('impact'):
        return sorted(
            signals,
            key=lambda signal: IMPACT_LEVELS.get(
                signal.get('impact', {}).get('level'), 0
            ),
            reverse=order == 'impact-desc',
        )
    return sorted(
        signals,
        key=lambda signal: signal.get('title', '').casefold(),
        reverse=order == 'title-desc',
    )


def build_response(snapshot, requested_day, count, order):
    signals = order_signals(snapshot['signals'], order)[:count]
    return {
        'date': snapshot.get('date', requested_day),
        'order': order,
        'requestedCount': count,
        'returnedCount': len(signals),
        'signals': signals,
    }


def main(arguments=None):
    options = parse_arguments(arguments)
    try:
        snapshot = load_snapshot(options.day)
        response = build_response(snapshot, options.day, options.count, options.order)
    except SignalQueryError as error:
        print(json.dumps({'error': str(error)}), file=sys.stderr)
        return 1

    print(json.dumps(response, ensure_ascii=False, indent=2))
    return 0


if __name__ == '__main__':
    sys.exit(main())
