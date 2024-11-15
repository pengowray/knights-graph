'use client';

import React, { useEffect, useRef, useState, useCallback, Suspense } from 'react';
import Cytoscape from 'cytoscape';
import { Card } from '@/components/ui/card';
import dynamic from 'next/dynamic';
import SpriteText from 'three-spritetext';
import { Mesh, SphereGeometry, MeshLambertMaterial, DoubleSide } from 'three';
import type { Mesh as MeshType, SphereGeometry as SphereGeometryType, MeshLambertMaterial as MeshLambertMaterialType, DoubleSide as DoubleSideType } from 'three';

// Dynamic imports for Cytoscape extensions
const layoutExtensions = {
  coseBilkent: () => import('cytoscape-cose-bilkent'),
  cola: () => import('cytoscape-cola'),
  avsdf: () => import('cytoscape-avsdf'),
  dagre: () => import('cytoscape-dagre'),
  elk: () => import('cytoscape-elk'),
  fcose: () => import('cytoscape-fcose'),
  klay: () => import('cytoscape-klay'),
  cise: () => import('cytoscape-cise'),
};

// Dynamic import for ForceGraph3D with no SSR
const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), {
  ssr: false,
  loading: () => <div>Loading 3D graph...</div>
});

declare module 'cytoscape' {
  interface BaseLayoutOptions {
    elk?: { 
      algorithm: string;
      'elk.spacing.nodeNode'?: number;
      'elk.layered.spacing.nodeNodeBetweenLayers'?: number;
    };
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
    // Dagre layout options
    rankDir?: 'TB' | 'BT' | 'LR' | 'RL';
    ranker?: 'network-simplex' | 'tight-tree' | 'longest-path';
    rankSep?: number;
    // Klay layout options
    nodeLayering?: string;
    nodePlacement?: string;
    // ELK layout options
    'elk.spacing.nodeNode'?: number;
    'elk.layered.spacing.nodeNodeBetweenLayers'?: number;
  }
}

interface Node {
  id: string;  // Explicitly define id as string
  isDark: boolean;
  color: string;
}

interface Link {
  source: string;
  target: string;
  data?: {
    source: string;
    target: string;
  };
}

type LayoutName = '3d-force' | 'chessboard' | 'cose' | 'cose-bilkent' | 'cola' | 'cise' | 'avsdf' | 'dagre' | 
                 'breadthfirst' | 'concentric' | 'elk-box' | 'elk-disco' | 'elk-layered' | 'elk-mrtree' | 'elk-stress' |
                 'fcose' | 'klay' | 'random';

const KnightsGraph = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Cytoscape.Core>();
  const [layout, setLayout] = useState<LayoutName>('chessboard');
  const [edgeStyle, setEdgeStyle] = useState<'straight' | 'haystack' | 'bezier' | 'unbundled-bezier' | 'segments' | 'taxi'>('straight');
  const [showArrows, setShowArrows] = useState(false);
  const [graphData, setGraphData] = useState<{ nodes: Node[], links: Link[] }>({ nodes: [], links: [] });

  const applyLayout = useCallback(() => {
    const cy = cyRef.current;
    if (!cy || layout === '3d-force') return;

    // Update default settings
    const defaultSettings = {
      fit: true,
      padding: 20,
      spacingFactor: 1,
      animate: true,
      nodeDimensionsIncludeLabels: true,
    };

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
        ...defaultSettings,
        name: 'elk',
        padding: 20,
        elk: { 
          algorithm: layout.split('-')[1],
          'elk.spacing.nodeNode': 80,  // Increase node spacing
          'elk.layered.spacing.nodeNodeBetweenLayers': 100,  // Increase layer spacing
        },
      }).run();
    }
    else if (layout === 'cola') {
      cy.layout({
        ...defaultSettings,
        name: 'cola',
        maxSimulationTime: 1500,
      }).run();
    }
    else if (layout === 'cise') {
      cy.layout({
        ...defaultSettings,
        name: 'cise',
        nodeSeparation: 40,
        idealInterClusterEdgeLengthCoefficient: 1.4,
        clusters: [],
        allowNodesInsideCircle: false,
        maxRatioOfNodesInsideCircle: 0.1,
        springCoeff: 0.45,
        nodeRepulsion: 4500,
        gravity: 0.25,
        gravityRange: 3.8,
      }).run();
    }
    else if (layout === 'dagre') {
      cy.layout({
        ...defaultSettings,
        name: 'dagre',
        rankDir: 'TB',
        ranker: 'tight-tree',
        rankSep: 50,  // Increase rank separation
        nodeSpacing: 20,   // Increase node separation
      }).run();
    }
    else if (layout === 'cose-bilkent') {
      cy.layout({
        ...defaultSettings,
        name: 'cose-bilkent',
        nodeRepulsion: 4500,
      }).run();
    }
    else if (layout === 'avsdf') {
      cy.layout({
        ...defaultSettings,
        name: 'avsdf',
        nodeSeparation: 60,
      }).run();
    }
    else if (layout === 'klay') {
      cy.layout({
        ...defaultSettings,
        name: 'klay',
        nodeLayering: 'NETWORK_SIMPLEX',
        nodePlacement: 'LINEAR_SEGMENTS',
      }).run();
    }
    else if (['cose', 'breadthfirst', 'fcose', 'random', 'concentric'].includes(layout)) {
      cy.layout({
        ...defaultSettings,
        name: layout,
        randomize: layout === 'random',
      }).run();
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
      
      // Reapply layout after edge style change
      setTimeout(() => applyLayout(), 50);
    });
  }, [edgeStyle, showArrows, applyLayout]);

  const registerExtensions = useCallback(async () => {
    if (typeof window === 'undefined') return;
    
    if (!Cytoscape.prototype.hasInitializedExtensions) {
      try {
        const extensions = await Promise.all([
          layoutExtensions.coseBilkent(),
          layoutExtensions.cola(),
          layoutExtensions.avsdf(),
          layoutExtensions.dagre(),
          layoutExtensions.elk(),
          layoutExtensions.fcose(),
          layoutExtensions.klay(),
          layoutExtensions.cise(),
        ]);

        extensions.forEach(ext => ext.default(Cytoscape));
        Cytoscape.prototype.hasInitializedExtensions = true;
      } catch (error) {
        console.error('Error loading Cytoscape extensions:', error);
      }
    }
  }, []);

  // Initialize cytoscape instance once on mount
  useEffect(() => {
    let cy: Cytoscape.Core | undefined;

    const initCytoscape = async () => {
      if (!containerRef.current) return;
      
      await registerExtensions();
      
      cy = Cytoscape({
        container: containerRef.current,
        style: [
          {
            selector: 'node',
            style: {
              width: 34,
              height: 34,
              shape: 'rectangle',
              label: 'data(id)',
              'text-valign': 'center',
              'text-halign': 'center',
              'font-size': '24px',
              'text-margin-y': 0,
              'background-color': (ele: Cytoscape.NodeSingular) => (ele.data('isDark') ? '#B58863' : '#F0D9B5'),
              'color': (ele: Cytoscape.NodeSingular) => (ele.data('isDark') ? 'white' : 'black'),
              'border-color': '#262D31',
              'border-width': 1,
            },
          },
          {
            selector: 'edge',
            style: {
              width: 1.3,  // Increase from 1
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
        minZoom: 0.1,  // Changed from 0.5
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
              links.push({
                source: node.data.id,
                target: target,
                data: { source: node.data.id, target: target }
              });
            }
          }
        });
      });

      cy.add([...nodes, ...links]);
      cyRef.current = cy;

      // Apply initial layout after a small delay
      setTimeout(() => applyLayout(), 50);
    };

    initCytoscape();

    return () => {
      if (cy) {
        cy.destroy();
        cyRef.current = undefined;
      }
    };
  }, [edgeStyle, showArrows, registerExtensions, applyLayout]);

  // Add this after the existing useEffect that initializes Cytoscape
  useEffect(() => {
    // Create 3D graph data
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];
    
    const nodes = [];
    const links = [];

    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        nodes.push({
          id: `${files[i]}${ranks[j]}`,
          isDark: (i + j) % 2 === 0,
          color: (i + j) % 2 === 0 ? '#B58863' : '#F0D9B5'
        });
      }
    }

    const dirs = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
    nodes.forEach((node) => {
      const file = files.indexOf(node.id[0]);
      const rank = ranks.indexOf(node.id[1]);

      dirs.forEach(([df, dr]) => {
        const newFile = file + df;
        const newRank = rank + dr;
        if (newFile >= 0 && newFile < 8 && newRank >= 0 && newRank < 8) {
          const target = `${files[newFile]}${ranks[newRank]}`;
          links.push({ source: node.id, target: target });
        }
      });
    });

    setGraphData({ nodes, links });
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

  const Force3DGraph = layout === '3d-force' ? (
    <div style={{ width: '100%', height: '100%', border: '1px solid #ccc' }}>
      <ForceGraph3D
        graphData={graphData}
        nodeLabel="id"
        backgroundColor="#ffffff"
        linkColor={() => '#15465C'}
        nodeThreeObject={node => {
          const sphere = new Mesh(
            new SphereGeometry(3.5),
            new MeshLambertMaterial({
              color: node.isDark ? '#B58863' : '#F0D9B5',
              transparent: true,
              opacity: 0.4,
              side: DoubleSide
            })
          );
          
          const label = new SpriteText(node.id as string);
          label.color = '#000000';
          label.textHeight = 6;
          label.renderOrder = 2;
          label.material.depthTest = false;
          label.material.depthWrite = false;
          
          sphere.add(label);
          return sphere;
        }}
      />
    </div>
  ) : null;

  return (
    <Card className="p-4 w-full">
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
          <option value="3d-force">3D Force</option>
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
      <div className="mb-4 text-center">
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

      <div style={{ 
        width: '100vw',
        height: '80vh',
        margin: '0 -1rem' // Compensate for Card padding
      }}>
        <div 
          ref={containerRef}
          id="cy" 
          style={{ 
            width: '100%', 
            height: '100%', 
            border: '1px solid #ccc',
            display: layout === '3d-force' ? 'none' : 'block'
          }}
        />
        {Force3DGraph}
      </div>
    </Card>
  );
};

declare module 'cytoscape' {
  interface Core {
    hasInitializedExtensions?: boolean;
  }
}

export default dynamic(() => Promise.resolve(KnightsGraph), { ssr: false });