"""Live acceptance probes. No mocked network, telemetry or model replies."""
import json
import os
import unittest
import urllib.request
import urllib.error

BASE = os.environ.get('MOS_TEST_URL', 'http://127.0.0.1:3130')
LEGACY = ['mission_control_overview', 'mission_control_jarvis_command_console',
          'mission_control_agents_fleet', 'mission_control_board_journal',
          'mission_control_omniroute_gateway', 'mission_control_paperclip_marketing',
          'mission_control_agent_memory_stores', 'mission_control_t5500_hardware_node',
          'mission_control_t5500_node_boot_timeline', 'mission_control_hermes_support_inbox',
          'mission_control_settings_logins', 'mission_control_lightx2v_studio_live_vtuber_creator',
          'mission_control_live_avatar_stream_vtuber_studio', 'mission_control_youandinotai_ecosystem',
          'mission_control_youandinotai_interactive_layers', 'three.js']


def get(route):
    with urllib.request.urlopen(BASE + route, timeout=35) as response:
        return response.read().decode('utf-8')


class LiveAcceptance(unittest.TestCase):
    def test_front_door_is_real_dashboard(self):
        html = get('/')
        self.assertIn('ops-dashboard.js', html)
        for fake in ['88.4%', '140ms TTFT', 'Simulate Auth Success', 'Core loop #4912']:
            self.assertNotIn(fake, html)

    def test_all_original_routes_are_real_dashboard(self):
        for screen in LEGACY:
            with self.subTest(screen=screen):
                self.assertIn('ops-dashboard.js', get('/screens/' + screen + '/'))

    def test_identity_feed_has_observed_state(self):
        state = json.loads(get('/api/mos-state.json'))
        self.assertEqual(state['identity'], 'mission-agent-os')
        self.assertIn('generated', state)
        self.assertTrue(state['services'])
        self.assertTrue(all('status' in s for s in state['services']))

    def test_new_browser_and_video_apis(self):
        for name in ['browser', 'video']:
            with self.subTest(api=name):
                payload = json.loads(get('/api/ops/' + name))
                self.assertIsInstance(payload.get('ok'), bool)
                self.assertIn('generated', payload)

    def test_cross_origin_dispatch_is_rejected(self):
        req = urllib.request.Request(BASE + '/api/jarvis/dispatch',
            data=json.dumps({'brain': 'INVALID_TEST_BRAIN', 'prompt': 'must not execute'}).encode(),
            headers={'Content-Type': 'application/json', 'Origin': 'https://untrusted.invalid'}, method='POST')
        try:
            with urllib.request.urlopen(req, timeout=15) as response:
                code = response.status
        except urllib.error.HTTPError as error:
            code = error.code
        self.assertEqual(code, 403)


if __name__ == '__main__':
    unittest.main(verbosity=2)
