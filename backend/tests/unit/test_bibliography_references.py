import unittest
import sys
import os

# Add backend directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from app.services.norm_control_checker import NormControlChecker

class TestBibliographyReferences(unittest.TestCase):
    def setUp(self):
        self.checker = NormControlChecker()
        self.bibliography = [
            {'index': 101, 'text': 'Source 1'},
            {'index': 102, 'text': 'Source 2'},
            {'index': 103, 'text': 'Source 3'}
        ]

    def test_valid_references(self):
        document_data = {
            'bibliography': self.bibliography,
            'paragraphs': [
                {'index': 1, 'text': 'Some text [1].'},
                {'index': 2, 'text': 'More text [1, 2].'},
                {'index': 3, 'text': 'Range [1-3].'},
                {'index': 4, 'text': 'With page [1, с. 25].'},
                {'index': 5, 'text': 'With page capital [1, С. 25].'},
                {'index': 6, 'text': 'With page english [1, p. 25].'},
            ]
        }
        issues = self.checker._check_bibliography_references(document_data)
        self.assertEqual(len(issues), 0, f"Should have no issues, but got: {issues}")

    def test_invalid_format_chars(self):
        document_data = {
            'bibliography': self.bibliography,
            'paragraphs': [
                {'index': 1, 'text': 'Invalid chars [1, abc].'},
            ]
        }
        issues = self.checker._check_bibliography_references(document_data)
        self.assertEqual(len(issues), 1)
        self.assertEqual(issues[0]['type'], 'reference_format_invalid_chars')

    def test_out_of_bounds(self):
        document_data = {
            'bibliography': self.bibliography,
            'paragraphs': [
                {'index': 1, 'text': 'Out of bounds [4].'},
                {'index': 2, 'text': 'Out of bounds range [1-5].'},
            ]
        }
        issues = self.checker._check_bibliography_references(document_data)
        # [4] -> 1 issue
        # [1-5] -> 4 and 5 are out of bounds -> 2 issues
        # Total 3 issues
        self.assertEqual(len(issues), 3)
        self.assertEqual(issues[0]['type'], 'reference_out_of_bounds')
        self.assertEqual(issues[1]['type'], 'reference_out_of_bounds')

    def test_ignore_bibliography_section(self):
        # Paragraphs that are part of the bibliography should be ignored
        document_data = {
            'bibliography': self.bibliography,
            'paragraphs': [
                {'index': 100, 'text': '[1] Source 1 description.'}, # This is part of bibliography
            ]
        }
        # Mock bibliography indices
        document_data['bibliography'][0]['index'] = 100
        
        issues = self.checker._check_bibliography_references(document_data)
        self.assertEqual(len(issues), 0)

if __name__ == '__main__':
    unittest.main()
