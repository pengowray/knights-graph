'use client';
import React, { useEffect, useRef, useState } from 'react';
import Cytoscape from 'cytoscape';
import coseBilkent from 'cytoscape-cose-bilkent';
import cola from 'cytoscape-cola';
import avsdf from 'cytoscape-avsdf';
import dagre from 'cytoscape-dagre';
import elk from 'cytoscape-elk';
import fcose from 'cytoscape-fcose';
import klay from 'cytoscape-klay';

import { Card } from '@/components/ui/card';

Cytoscape.use(coseBilkent);
Cytoscape.use(cola);
Cytoscape.use(avsdf);
Cytoscape.use(dagre);
Cytoscape.use(elk);
Cytoscape.use(fcose);
Cytoscape.use(klay);

const KnightsGraph = () => {
  const cyRef = useRef(null);
  const [layout, setLayout] = useState('chessboard');
  const [edgeStyle, setEdgeStyle] = useState('straight');
  const [showArrows, setShowArrows] = useState(false);

  const initializeCytoscape = () => {
    if (!cyRef.current) {
      cyRef.current = Cytoscape({
        container: document.getElementById('cy'),
        style: [
          {
            selector: 'node',
            style: {
              width: 20,
              height: 20,
              shape: 'rectangle',
              label: 'data(id)',
              'text-valign': 'center',
              'text-halign': 'center',
              'background-color': (ele) => (ele.data('isDark') ? '#B58863' : '#F0D9B5'),
              color: (ele) => (ele.data('isDark') ? 'white' : 'black'),
              'border-color': '#262D31',
              'border-width': 1,
            },
          },
          {
            selector: 'edge',
            style: {
              width: 1,
              'line-color': '#15465C',
              'curve-style': edgeStyle,
              'source-arrow-shape': showArrows ? 'triangle' : 'none',
              'target-arrow-shape': showArrows ? 'triangle' : 'none',
              'arrow-scale': 0.6,
            },
          },
        ],
      });

      const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
      const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];
      const nodes = [];
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          nodes.push({
            data: { id: `${files[i]}${ranks[j]}`, isDark: (i + j) % 2 === 0 },
          });
        }
      }

      const links = [];
      const dirs = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
      nodes.forEach((node) => {
        const file = files.indexOf(node.data.id[0]);
        const rank = ranks.indexOf(node.data.id[1]);

        dirs.forEach(([df, dr]) => {
          const newFile = file + df;
          const newRank = rank + dr;

          if (newFile >= 0 && newFile < 8 && newRank >= 0 && newRank < 8) {
            const target = `${files[newFile]}${ranks[newRank]}`;
            if (node.data.id < target) {
              links.push({
                data: { source: node.data.id, target: target },
              });
            }
          }
        });
      });

      cyRef.current.add([...nodes, ...links]);
      applyLayout();
    }
  };

  const applyLayout = () => {
    if (cyRef.current) {
      let layoutOptions;

      if (layout === 'chessboard') {
        layoutOptions = {
          name: 'preset',
          positions: (node) => {
            const id = node.id();
            const file = id.charCodeAt(0) - 'a'.charCodeAt(0);
            const rank = parseInt(id[1], 10) - 1;
            return { x: file * 80, y: (7 - rank) * 80 }; // Reversed y-axis for chessboard perspective
          },
        };
      } else if (layout === 'elk-layered' || layout === 'elk-mrtree') {
        layoutOptions = {
          name: 'elk',
          elk: { algorithm: layout.split('-')[1] },
          animate: true,
        };
      } else {
        layoutOptions = { name: layout, animate: true };
      }

      cyRef.current.layout(layoutOptions).run();
    }
  };

  const updateEdgeStyle = () => {
    cyRef.current.style()
      .selector('edge')
      .style({
        'curve-style': edgeStyle,
        'source-arrow-shape': showArrows ? 'triangle' : 'none',
        'target-arrow-shape': showArrows ? 'triangle' : 'none',
      })
      .update();
  };

  useEffect(() => {
    initializeCytoscape();
    return () => cyRef.current?.destroy();
  }, []);

  useEffect(() => {
    applyLayout();
  }, [layout]);

  useEffect(() => {
    updateEdgeStyle();
  }, [edgeStyle, showArrows]);

  return (
    <Card className="p-4 w-full max-w-3xl mx-auto">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold">Knight's Move Graph</h2>
        <p className="text-sm text-gray-600">Visualization of possible knight moves on a chess board</p>
      </div>
      <div className="mb-4 text-center">
        <label htmlFor="layout-select" className="mr-2">Choose Layout:</label>
        <select
          id="layout-select"
          value={layout}
          onChange={(e) => setLayout(e.target.value)}
          className="border rounded px-2 py-1"
        >
          <option value="chessboard">Chessboard</option>
          <option value="cose">Cose</option>
          <option value="cose-bilkent">Cose-Bilkent</option>
          <option value="cola">Cola</option>
          <option value="avsdf">Avsdf</option>
          <option value="dagre">Dagre</option>
          <option value="breadthfirst">Breadthfirst</option>
          <option value="elk-layered">ELK (Layered)</option>
          <option value="elk-mrtree">ELK (mrtree)</option>
          <option value="fcose">fCoSE</option>
          <option value="klay">Klay</option>
          <option value="random">Random</option>
        </select>
      </div>
      <div className="mb-4 text-center">
        <label htmlFor="edge-style-select" className="mr-2">Edge Style:</label>
        <select
          id="edge-style-select"
          value={edgeStyle}
          onChange={(e) => setEdgeStyle(e.target.value)}
          className="border rounded px-2 py-1"
        >
          <option value="straight">Straight</option>
          <option value="taxi">Taxi</option>
          <option value="bezier">Bezier</option>
          <option value="unbundled-bezier">Unbundled Bezier</option>
          <option value="segments">Segments</option>
        </select>
      </div>
      <div className="mb-4 text-center">
        <input
          type="checkbox"
          id="show-arrows"
          checked={showArrows}
          onChange={(e) => setShowArrows(e.target.checked)}
          className="mr-2"
        />
        <label htmlFor="show-arrows">Show Arrow Heads</label>
      </div>
      <div id="cy" style={{ width: '600px', height: '600px', border: '1px solid #ccc' }}></div>
    </Card>
  );
};

export default KnightsGraph;