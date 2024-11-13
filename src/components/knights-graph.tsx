'use client';
import React, { useEffect, useRef, useState } from 'react';
import Cytoscape from 'cytoscape';
import coseBilkent from 'cytoscape-cose-bilkent';
import cola from 'cytoscape-cola';
import { Card } from '@/components/ui/card';

Cytoscape.use(coseBilkent);
Cytoscape.use(cola);

const KnightsGraph = () => {
  const cyRef = useRef(null);
  const [layout, setLayout] = useState('cose');

  useEffect(() => {
    // Initialize Cytoscape only once
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
            data: { id: `${files[i]}${ranks[j]}`, isDark: (i + j) % 2 === 1 },
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
    }

    return () => {
      cyRef.current.destroy();
    };
  }, []);

  useEffect(() => {
    // Run the layout when cyRef.current is initialized and layout changes
    if (cyRef.current) {
      cyRef.current.layout({ name: layout, animate: true }).run();
    }
  }, [layout]);

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
          <option value="cose">Cose</option>
          <option value="cose-bilkent">Cose-Bilkent</option>
          <option value="cola">Cola</option>
          <option value="breadthfirst">Breadthfirst</option>
          <option value="random">Random</option>
        </select>
      </div>
      <div id="cy" style={{ width: '600px', height: '600px', border: '1px solid #ccc' }}></div>
    </Card>
  );
};

export default KnightsGraph;
