import React, { useState, useEffect, useRef } from 'react';
import { Box, Paper, Typography, ToggleButton, ToggleButtonGroup, CircularProgress, Alert } from '@mui/material';
import ViewQuiltIcon from '@mui/icons-material/ViewQuilt';
import DifferenceIcon from '@mui/icons-material/Difference';
import axios from 'axios';
import DOMPurify from 'dompurify';
import * as Diff from 'diff';
import './DocumentViewer.css';

const DocumentViewer = ({ originalPath, correctedPath }) => {
    const [mode, setMode] = useState('split'); // 'split', 'diff'
    const [originalHtml, setOriginalHtml] = useState('');
    const [correctedHtml, setCorrectedHtml] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [diffElements, setDiffElements] = useState(null);

    const leftPaneRef = useRef(null);
    const rightPaneRef = useRef(null);
    const isScrolling = useRef(false);

    useEffect(() => {
        const fetchPreviews = async () => {
            if (!originalPath && !correctedPath) return;

            setLoading(true);
            setError(null);
            try {
                const requests = [];
                if (originalPath) requests.push(axios.post('/api/preview/generate', { path: originalPath }));
                else requests.push(Promise.resolve({ data: { html: '<p>No original file</p>' } }));

                if (correctedPath) requests.push(axios.post('/api/preview/generate', { path: correctedPath }));
                else requests.push(Promise.resolve({ data: { html: '<p>No corrected file</p>' } }));

                const [origRes, corrRes] = await Promise.all(requests);
                setOriginalHtml(origRes.data.html);
                setCorrectedHtml(corrRes.data.html);
            } catch (err) {
                console.error("Error fetching previews:", err);
                setError("Failed to load document previews. Please ensure the files exist.");
            } finally {
                setLoading(false);
            }
        };

        fetchPreviews();
    }, [originalPath, correctedPath]);

    useEffect(() => {
        if (mode === 'diff' && originalHtml && correctedHtml) {
            // Compute diff
            const parser = new DOMParser();
            const docOrig = parser.parseFromString(originalHtml, 'text/html');
            const docCorr = parser.parseFromString(correctedHtml, 'text/html');
            
            const textOrig = docOrig.body.textContent || "";
            const textCorr = docCorr.body.textContent || "";
            
            const diff = Diff.diffWords(textOrig, textCorr);
            
            const elements = diff.map((part, index) => {
                const className = part.added ? 'diff-added' : part.removed ? 'diff-removed' : '';
                return (
                    <span key={index} className={className}>
                        {part.value}
                    </span>
                );
            });
            setDiffElements(elements);
        }
    }, [originalHtml, correctedHtml, mode]);

    const handleScroll = (source) => (e) => {
        if (mode !== 'split') return;
        if (isScrolling.current) return;

        isScrolling.current = true;
        const target = source === 'left' ? rightPaneRef.current : leftPaneRef.current;
        const sourceEl = e.target;

        if (target) {
            // Calculate percentage to handle different heights
            const percentage = sourceEl.scrollTop / (sourceEl.scrollHeight - sourceEl.clientHeight);
            target.scrollTop = percentage * (target.scrollHeight - target.clientHeight);
        }

        setTimeout(() => {
            isScrolling.current = false;
        }, 50);
    };

    const handleModeChange = (event, newMode) => {
        if (newMode !== null) {
            setMode(newMode);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" p={4}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
        );
    }

    return (
        <div className="document-viewer-container">
            <div className="viewer-controls">
                <ToggleButtonGroup
                    value={mode}
                    exclusive
                    onChange={handleModeChange}
                    aria-label="view mode"
                    size="small"
                >
                    <ToggleButton value="split" aria-label="split view">
                        <ViewQuiltIcon sx={{ mr: 1 }} /> Split View
                    </ToggleButton>
                    <ToggleButton value="diff" aria-label="diff view">
                        <DifferenceIcon sx={{ mr: 1 }} /> Text Diff
                    </ToggleButton>
                </ToggleButtonGroup>
            </div>

            <div className="viewer-content">
                {mode === 'split' ? (
                    <>
                        <div className="doc-pane">
                            <div className="doc-pane-header">Original</div>
                            <div 
                                className="doc-pane-body" 
                                ref={leftPaneRef}
                                onScroll={handleScroll('left')}
                                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(originalHtml) }}
                            />
                        </div>
                        <div className="doc-pane">
                            <div className="doc-pane-header">Corrected</div>
                            <div 
                                className="doc-pane-body" 
                                ref={rightPaneRef}
                                onScroll={handleScroll('right')}
                                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(correctedHtml) }}
                            />
                        </div>
                    </>
                ) : (
                    <div className="doc-pane" style={{ width: '100%' }}>
                        <div className="doc-pane-header">Text Differences</div>
                        <div className="doc-pane-body diff-view-container">
                            {diffElements}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DocumentViewer;
