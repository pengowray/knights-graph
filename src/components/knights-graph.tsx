'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Cytoscape from 'cytoscape';
import coseBilkent from 'cytoscape-cose-bilkent';
import cola from 'cytoscape-cola';
import avsdf from 'cytoscape-avsdf';
import dagre from 'cytoscape-dagre';
import elk from 'cytoscape-elk';
import fcose from 'cytoscape-fcose';
import klay from 'cytoscape-klay';
import cise from 'cytoscape-cise';

import { Card } from '@/components/ui/card';

// Register Cytoscape extensions
if (typeof window !== 'undefined') {
  coseBilkent(Cytoscape);
  cola(Cytoscape);
  avsdf(Cytoscape);
  dagre(Cytoscape);
  elk(Cytoscape);
  fcose(Cytoscape);
  klay(Cytoscape);
  cise(Cytoscape);
}

declare module 'cytoscape' {
  interface BaseLayoutOptions {
    elk?: { algorithm: string };
    name: string;
    fit?: boolean;
    padding?: number;
    positions?: { [key: string]: { x: number, y: number } };
    animate?: boolean;
    randomize?: boolean;
    nodeSpacing?: number;
    maxSimulationTime?: number;
    nodeSeparation?: number;
    spacingFactor?: number;
    nodeDimensionsIncludeLabels?: boolean;
    // CiSE layout options
    clusters?: { id: string; nodes: string[] }[];
    allowNodesInsideCircle?: boolean;
    maxRatioOfNodesInsideCircle?: number;
    springCoeff?: number;
    nodeRepulsion?: number;
    gravity?: number;
    gravityRange?: number;
    idealInterClusterEdgeLengthCoefficient?: number;
  }
}

interface Link {
  data: {
    source: string;
    target: string;
  }
}

type LayoutName = 'chessboard' | 'cose' | 'cose-bilkent' | 'cola' | 'cise' | 'avsdf' | 'dagre' | 
                 'breadthfirst' | 'concentric' | 'elk-box' | 'elk-disco' | 'elk-layered' | 'elk-mrtree' | 'elk-stress' |
                 'fcose' | 'klay' | 'random';

const KnightsGraph = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Cytoscape.Core>();
  const [layout, setLayout] = useState<LayoutName>('chessboard');
  const [edgeStyle, setEdgeStyle] = useState<'straight' | 'haystack' | 'bezier' | 'unbundled-bezier' | 'segments' | 'taxi'>('straight');
  const [showArrows, setShowArrows] = useState(false);

  const applyLayout = useCallback(() => {
    const cy = cyRef.current;
    if (!cy) return;

    if (layout === 'chessboard') {
      const positions: {[key: string]: {x: number, y: number}} = {};
      
      cy.nodes().forEach(node => {
        const id = node.id();
        const file = id.charCodeAt(0) - 'a'.charCodeAt(0);
        const rank = parseInt(id[1], 10) - 1;
        positions[id] = {
          x: file * 80,
          y: (7 - rank) * 80
        };
      });

      cy.layout({
        name: 'preset',
        positions: positions,
        fit: true
      }).run();
    } 
    else if (layout.startsWith('elk-')) {
      cy.layout({
        name: 'elk',
        elk: { algorithm: layout.split('-')[1] },
        fit: true,
        padding: 50
      }).run();
    }
    else if (layout === 'cola') {
      cy.layout({
        name: 'cola',
        fit: true,
        padding: 50,
        nodeSpacing: 30,
        maxSimulationTime: 1500
      }).run();
    }
    else if (layout === 'cise') {
      cy.layout({
        name: 'cise',
        fit: true,
        padding: 50,
        nodeSeparation: 75,
        idealInterClusterEdgeLengthCoefficient: 1.4,
        clusters: [], // No specific clusters
        allowNodesInsideCircle: false,
        maxRatioOfNodesInsideCircle: 0.1,
        springCoeff: 0.45,
        nodeRepulsion: 4500,
        gravity: 0.25,
        gravityRange: 3.8
      }).run();
    }
    else if (layout === 'dagre') {
      cy.layout({
        name: 'dagre',
        fit: true,
        padding: 50,
        spacingFactor: 1.25
      }).run();
    }
    else if (layout === 'cose-bilkent') {
      cy.layout({
        name: 'cose-bilkent',
        fit: true,
        padding: 50,
        nodeDimensionsIncludeLabels: true
      }).run();
    }
    else {
      // For other layouts (cose, breadthfirst, fcose, klay, random, avsdf)
      const commonOptions = {
        name: layout,
        fit: true,
        padding: 50,
        randomize: layout === 'random',
        animate: false
      };
      cy.layout(commonOptions).run();
    }
  }, [layout]);

  const updateEdgeStyle = useCallback(() => {
    const cy = cyRef.current;
    if (!cy) return;
    
    requestAnimationFrame(() => {
      if (!cy) return;
      cy.style()
        .selector('edge')
        .style({
          'curve-style': edgeStyle,
          'source-arrow-shape': showArrows ? 'triangle' : 'none',
          'target-arrow-shape': showArrows ? 'triangle' : 'none',
        });

      cy.style().update();
    });
  }, [edgeStyle, showArrows]);

  // Initialize cytoscape instance once on mount
  useEffect(() => {
    if (!containerRef.current) return;
    
    const cy = Cytoscape({
      container: containerRef.current,
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
            'background-color': (ele: Cytoscape.NodeSingular) => (ele.data('isDark') ? '#B58863' : '#F0D9B5'),
            'color': (ele: Cytoscape.NodeSingular) => (ele.data('isDark') ? 'white' : 'black'),
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
            'control-point-step-size': 40,
            'taxi-direction': 'horizontal',
            'taxi-turn': 50,
            'segment-distances': 20,
            'segment-weights': 0.5
          },
        },
      ],
      wheelSensitivity: 0.2,
      minZoom: 0.5,
      maxZoom: 2
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

    const links: Link[] = [];
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
            links.push({ data: { source: node.data.id, target: target } });
          }
        }
      });
    });

    cy.add([...nodes, ...links]);
    cyRef.current = cy;

    return () => {
      cy.destroy();
      cyRef.current = undefined;
    };
  }, []);

  // Apply layout when it changes
  useEffect(() => {
    if (cyRef.current) {
      applyLayout();
    }
  }, [applyLayout]);

  // Update edge style when it changes
  useEffect(() => {
    if (cyRef.current) {
      updateEdgeStyle();
    }
  }, [updateEdgeStyle]);

  return (
    <Card className="p-4 w-full max-w-3xl mx-auto">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold">Knight&apos;s Move Graph (with cytoscape.js)</h2>
        <p className="text-sm text-gray-600">Visualization of possible knight moves on a chess board</p>
      </div>
      <div className="mb-4 text-center">
        <label htmlFor="layout-select" className="mr-2">Choose Layout:</label>
        <select
          id="layout-select"
          value={layout}
          onChange={(e) => setLayout(e.target.value as LayoutName)}
          className="border rounded px-2 py-1"
        >
          <option value="chessboard">Chessboard</option>
          <option value="random">Random</option>
          <option value="fcose">fCoSE</option>
          <option value="avsdf">Avsdf</option>
          <option value="breadthfirst">Breadthfirst</option>
          <option value="cise">CiSE</option>
          <option value="cola">Cola</option>
          <option value="concentric">Concentric</option>
          <option value="cose">Cose</option>
          <option value="cose-bilkent">Cose-Bilkent</option>
          <option value="dagre">Dagre</option>
          <option value="elk-box">ELK (box)</option>
          {/*<option value="elk-disco">ELK (Disco)</option>*/}
          <option value="elk-layered">ELK (layered)</option>
          <option value="elk-mrtree">ELK (mrtree)</option>
          <option value="elk-stress">ELK (stress)</option>
          <option value="klay">Klay</option>
        </select>
      </div>
      <div className="mb-4 text-center" style={{ display: 'none' }}>
        <label htmlFor="edge-style-select" className="mr-2">Edge Style:</label>
        <select
          id="edge-style-select"
          value={edgeStyle}
          onChange={(e) => setEdgeStyle(e.target.value as 'straight' | 'haystack' | 'bezier' | 'unbundled-bezier' | 'segments' | 'taxi')}
          className="border rounded px-2 py-1"
        >
          <option value="straight">Straight</option>
          <option value="taxi">Taxi</option>
          <option value="bezier">Bezier</option>
          <option value="unbundled-bezier">Unbundled Bezier</option>
          <option value="segments">Segments</option>
        </select>
      </div>
      <div className="mb-4 text-center" style={{ display: 'none' }}>
        <input
          type="checkbox"
          id="show-arrows"
          checked={showArrows}
          onChange={(e) => setShowArrows(e.target.checked)}
          className="mr-2"
        />
        <label htmlFor="show-arrows">Show Arrow Heads</label>
      </div>
      <div 
        ref={containerRef}
        id="cy" 
        style={{ width: '700px', height: '700px', border: '1px solid #ccc' }}
      />
    </Card>
  );
};

export default KnightsGraph;