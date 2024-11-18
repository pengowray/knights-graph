'use client';

import React, { useEffect, useRef, useState, useCallback, Suspense } from 'react';
import Cytoscape from 'cytoscape';
import { Card } from '@/components/ui/card';
import dynamic from 'next/dynamic';
import SpriteText from 'three-spritetext';
import { Mesh, SphereGeometry, BoxGeometry, MeshPhongMaterial, DoubleSide, 
         DirectionalLight, AmbientLight, PointLight, Fog, 
         TubeGeometry, CatmullRomCurve3, Vector3, LineBasicMaterial, BufferGeometry, Line } from 'three';
import type { Mesh as MeshType, SphereGeometry as SphereGeometryType, BoxGeometry as BoxGeometryType, MeshLambertMaterial as MeshLambertMaterialType, DoubleSide as DoubleSideType } from 'three';
import * as THREE from 'three';

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
      'elk.aspectRatio'?: number;
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
    refresh?: number;
    // Dagre layout options
    rankDir?: 'TB' | 'BT' | 'LR' | 'RL';
    ranker?: 'network-simplex' | 'tight-tree' | 'longest-path';
    rankSep?: number;
    // Klay layout options
    nodeLayering?: string;
    nodePlacement?: string;
    aspectRatio?: number;
    direction?: string;
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

// Update LayoutName type to include new variants
type LayoutName = '3d-force' | 'chessboard' | 'cose' | 'cose-bilkent' | 'cola' | 
                 'cise-ranks' | 'cise-quarters' | 'cise-whole' | 'cise-colors' | 'cise-singles' | 
                 'avsdf' | 'dagre' | 'breadthfirst' | 'breadthfirst-circle' | 'concentric' |
                 'elk-box' | 'elk-disco' | 'elk-layered' | 'elk-mrtree' | 'elk-stress' |
                 'fcose' | 'klay' | 'random';

const KnightsGraph = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Cytoscape.Core>();
  const fgRef = useRef<any>();
  const [layout, setLayout] = useState<LayoutName>('chessboard');
  const [edgeStyle, setEdgeStyle] = useState<'straight' | 'haystack' | 'bezier' | 'unbundled-bezier' | 'segments' | 'taxi' | 'taxi-vertical'>('straight');
  const [showArrows, setShowArrows] = useState(false);
  const [graphData, setGraphData] = useState<{ nodes: Node[], links: Link[] }>({ nodes: [], links: [] });
  const [nodeSize, setNodeSize] = useState(34); // Default node size
  const [wiggleMode, setWiggleMode] = useState(false); // Add wiggleMode state
  const [cameraDistance, setCameraDistance] = useState<number | null>(null);
  const [savedCameraPosition, setSavedCameraPosition] = useState<{ x: number, y: number, z: number } | null>(null);
  const [is3DChessboard, setIs3DChessboard] = useState(false);

  const getRandomizedPositions = useCallback((cy: Cytoscape.Core) => {
    const positions: {[key: string]: {x: number, y: number}} = {};
    const width = cy.width();
    const height = cy.height();
    const padding = 50;  // Keep nodes away from edges
    
    cy.nodes().forEach(node => {
      positions[node.id()] = {
        x: padding + Math.random() * (width + 100),
        y: padding + Math.random() * (height + 100)
      };
    });
    return positions;
  }, []);

  const createChessClusters = useCallback((cy: Cytoscape.Core) => {
    // Create clusters by ranks (rows) instead of files
    const clusterArrays: string[][] = [];
    for (let rank = 1; rank <= 8; rank++) {
      const nodesInRank = cy.nodes().filter(node => node.id()[1] === rank.toString());
      if (nodesInRank.length > 0) {
        clusterArrays.push(nodesInRank.map(node => node.id()));
      }
    }
    return clusterArrays;
  }, []);

  // Add clustering strategies
  const createQuarterClusters = useCallback((cy: Cytoscape.Core) => {
    const clusters: string[][] = Array(4).fill(null).map(() => []);
    
    cy.nodes().forEach(node => {
      const file = node.id()[0].charCodeAt(0) - 'a'.charCodeAt(0);
      const rank = parseInt(node.id()[1]) - 1;
      const quarterIndex = (Math.floor(file/4) * 2) + Math.floor(rank/4);
      clusters[quarterIndex].push(node.id());
    });
    
    return clusters;
  }, []);

  // Add new clustering function after createQuarterClusters
  const createColorClusters = useCallback((cy: Cytoscape.Core) => {
    const darkSquares: string[] = [];
    const lightSquares: string[] = [];
    
    cy.nodes().forEach(node => {
      const id = node.id();
      const file = id.charCodeAt(0) - 'a'.charCodeAt(0);
      const rank = parseInt(id[1]) - 1;
      if ((file + rank) % 2 === 0) {
        darkSquares.push(id);
      } else {
        lightSquares.push(id);
      }
    });
    
    return [darkSquares, lightSquares];
  }, []);

  // Add after createColorClusters
  const createEdgePairClusters = useCallback((cy: Cytoscape.Core) => {
    const clusters: string[][] = [];
    
    cy.edges().forEach(edge => {
      clusters.push([edge.source().id(), edge.target().id()]);
    });
    
    return clusters;
  }, []);

  const updateEdgeStyle = useCallback(() => {
    const cy = cyRef.current;
    if (!cy) return;
    
    cy.edges().forEach(edge => {
      const baseStyle = {
        'curve-style': edgeStyle,
        'source-arrow-shape': showArrows ? 'triangle' : 'none',
        'target-arrow-shape': showArrows ? 'triangle' : 'none',
      };

      // Add specific configurations for each edge style
      const styleConfig = {
        'bezier': {
          'control-point-step-size': 40,
          'control-point-weight': 0.5,
          'curve-style': 'bezier'
        },
        'unbundled-bezier': {
          'control-point-distances': [20],
          'control-point-weights': [0.5]
        },
        'taxi': {
          'taxi-direction': 'horizontal',
          'taxi-turn': 50
        },
        'taxi-vertical': {
          'curve-style': 'taxi',
          'taxi-direction': 'vertical',
          'taxi-turn': 50
        },
        'haystack': {
          'haystack-radius': 0.5
        },
        'segments': {
          'segment-distances': 20,
          'segment-weights': 0.5
        }
      };

      edge.style({
        ...baseStyle,
        ...(styleConfig[edgeStyle as keyof typeof styleConfig] || {})
      });
    });
  }, [edgeStyle, showArrows]);

  const updateNodeSize = useCallback(() => {
    const cy = cyRef.current;
    if (!cy) return;
    
    cy.nodes().forEach(node => {
      node.style({
        width: nodeSize,
        height: nodeSize,
        'font-size': `${nodeSize / 1.4}px`,
      });
    });
  }, [nodeSize]);

  const applyLayout = useCallback(() => {
    const cy = cyRef.current;
    if (!cy || layout === '3d-force') return;

    // Update default settings
    const defaultSettings = {
      fit: true,
      padding: 20,
      spacingFactor: 1.5,
      animate: true,
      nodeDimensionsIncludeLabels: true,
      // Add randomized starting positions for all non-chessboard layouts
      positions: layout !== 'chessboard' ? getRandomizedPositions(cy) : undefined
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
        fit: true,
        animate: true, // Enable animation
        animationDuration: 1000, // Set animation duration
        animationEasing: 'ease-in-out' // Set animation easing
      }).run();
    } 
    else if (layout === 'elk-layered') {
      cy.layout({
        ...defaultSettings,
        name: 'elk',
        padding: 20,
        elk: { 
          algorithm: 'layered',
          'elk.spacing.nodeNode': 80,
          'elk.layered.spacing.nodeNodeBetweenLayers': 100,
        },
      }).run();
    }
    else if (layout === 'elk-box') {
      cy.layout({
        ...defaultSettings,
        name: 'elk',
        aspectRatio: 2,
        elk: { 
          algorithm: 'box',
          'elk.aspectRatio': 2
        },
      }).run();
    }
    else if (layout.startsWith('elk-')) {
      cy.layout({
        ...defaultSettings,
        name: 'elk',
        padding: 20,
        elk: { 
          algorithm: layout.split('-')[1],
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
    else if (layout.startsWith('cise-')) {
      let clusters;
      
      switch(layout) {
        case 'cise-ranks':
          clusters = createChessClusters(cy);
          break;
        case 'cise-quarters':
          clusters = createQuarterClusters(cy);
          break;
        case 'cise-colors':
          clusters = createColorClusters(cy);
          break;
        case 'cise-singles':
          // Each node in its own cluster
          clusters = cy.nodes().map(node => [node.id()]);
          //clusters = createEdgePairClusters(cy);
          break;
        case 'cise-whole':
          clusters = [cy.nodes().map(node => node.id())]; // Single cluster
          break;
      }

      cy.layout({
        ...defaultSettings,
        name: 'cise',
        clusters,
        randomize: true,
        refresh: 50,
        nodeSeparation: 2,
        spacingFactor: 1,
        idealInterClusterEdgeLengthCoefficient: 1.4,
        allowNodesInsideCircle: false,
        maxRatioOfNodesInsideCircle: 0.1,
        springCoeff: 0.45,
        nodeRepulsion: 4500, 
        gravity: 0.25,
        gravityRange: layout === 'cise-singles' ? 1.5 : 3.8, // Smaller range for single-node
        animate: true
      }).run();
    }
    else if (layout === 'dagre') {
      cy.layout({
        ...defaultSettings,
        name: 'dagre',
        rankDir: 'TB',
        ranker: 'tight-tree',
        rankSep: 50,
        nodeSpacing: 20, 
      }).run();
    }
    else if (layout === 'cose-bilkent') {
      cy.layout({
        ...defaultSettings,
        name: 'cose-bilkent',
        nodeRepulsion: 10000, // 4500,
        nodeSpacing: 100, 
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
        //nodeLayering: 'NETWORK_SIMPLEX', // NETWORK_SIMPLEX, LONGEST_PATH, INTERACTIVE
        //nodePlacement: 'BRANDES_KOEPF', // BRANDES_KOEPF, LINEAR_SEGMENTS, INTERACTIVE, SIMPLE
        //direction: 'LEFT', // DOWN, RIGHT, LEFT, UP
        aspectRatio: 1,
        //spacing: 20
      }).run();
    }
    else if (layout === 'breadthfirst') {
      cy.layout({
        ...defaultSettings,
        name: 'breadthfirst',
        directed: false,
        grid: true,
        circle: false,
        avoidOverlap: true,
      }).run();
    }
    else if (layout === 'breadthfirst-circle') {
      cy.layout({
        ...defaultSettings,
        name: 'breadthfirst',
        directed: false,
        circle: true,
        avoidOverlap: true,
      }).run();
    }
    else if (['cose', 'fcose', 'random', 'concentric'].includes(layout)) {
      cy.layout({
        ...defaultSettings,
        name: layout,
        // Randomize initial positions for force-directed layouts
        randomize: layout === 'random' || layout === 'fcose' || layout === 'cose',
      }).run();
    }
  }, [layout, getRandomizedPositions, createChessClusters, createQuarterClusters, createColorClusters, createEdgePairClusters]);

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

  const initializeStyles = useCallback((cy: Cytoscape.Core) => {
    cy.style([
      {
        selector: 'node',
        style: {
          shape: 'rectangle',
          label: 'data(id)',
          'text-valign': 'center',
          'text-halign': 'center',
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
          width: 1.3,
          'line-color': '#15465C',
          'arrow-scale': 0.6,
          'control-point-step-size': 40,
          'taxi-direction': 'horizontal',
          'taxi-turn': 50,
          'segment-distances': 20,
          'segment-weights': 0.5
        },
      },
    ]);
  }, []);

  // Add this utility function inside the component
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Add this function after other useCallbacks
  const setupLights = useCallback((scene: THREE.Scene, camera: THREE.PerspectiveCamera) => {
    // Clear any existing lights
    scene.children = scene.children.filter(child => !(child instanceof DirectionalLight || child instanceof PointLight));

    // Calculate fog based on camera position and graph size
    const cameraDistance = camera.position.length();
    const fogNear = cameraDistance * 0.1;
    const fogFar = cameraDistance * 2;

    // Update fog with new calculated values
    scene.fog = new Fog(0xffffff, fogNear, fogFar);

    // Key light (main directional light)
    const keyLight = new DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(200, 200, 200);
    scene.add(keyLight);

    // Fill light (softer light from opposite side)
    const fillLight = new DirectionalLight(0xffffff, 0.7);
    fillLight.position.set(-200, 0, -200);
    scene.add(fillLight);

    // Back light (rim lighting)
    const backLight = new DirectionalLight(0xffffff, 0.7);
    backLight.position.set(-100, 200, -100);
    scene.add(backLight);

    // Ambient light for overall illumination
    const ambientLight = new AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
  }, []);

  // Initialize cytoscape instance once on mount
  useEffect(() => {
    let cy: Cytoscape.Core | undefined;

    const initCytoscape = async () => {
      if (!containerRef.current) return;
      
      await registerExtensions();
      
      cy = Cytoscape({
        container: containerRef.current,
        style: [],  // Empty initial style
        wheelSensitivity: 0.2,
        minZoom: 0.1,
        maxZoom: 2
      });

      initializeStyles(cy);  // Apply base styles
      updateNodeSize();      // Apply initial node size
      updateEdgeStyle();     // Apply initial edge style

      const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
      const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];
      let nodes = [];
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          nodes.push({
            data: { id: `${files[i]}${ranks[j]}`, isDark: (i + j) % 2 === 0 },
          });
        }
      }
      nodes = shuffleArray(nodes); // Randomize node order

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
              // doubled links in case two-way makes a difference for any layouts
              links.push({
                source: target,
                target: node.data.id,
                data: { source: target, target: node.data.id }
              });
            }
          }
        });
      });

      cy.add([...nodes, ...shuffleArray(links)]); // Randomize edge order
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
  }, [registerExtensions, initializeStyles]);

  // Add this after the existing useEffect that initializes Cytoscape
  useEffect(() => {
    // Create 3D graph data
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];
    
    let nodes = [];
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        nodes.push({
          id: `${files[i]}${ranks[j]}`,
          isDark: (i + j) % 2 === 0,
          color: (i + j) % 2 === 0 ? '#B58863' : '#F0D9B5'
        });
      }
    }

    // Define shuffleArray inside useEffect to avoid dependency issues
    const shuffleArray = <T,>(array: T[]): T[] => {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };

    nodes = shuffleArray(nodes);

    const links = [];
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

    setGraphData({ nodes, links: shuffleArray(links) });
  }, []); // Remove shuffleArray from dependencies

  // Add useEffect for wiggleMode
  useEffect(() => {
    if (layout !== '3d-force' || !wiggleMode || !fgRef || !fgRef.current) return;

    // Store initial camera position when entering wiggle mode
    if (!savedCameraPosition) {
      const camera = fgRef.current.camera();
      const pos = camera.position;
      setSavedCameraPosition({ x: pos.x, y: pos.y, z: pos.z });
      setCameraDistance(pos.length());
    }

    const interval = setInterval(() => {
      if (!fgRef || !fgRef.current) return;
      const angle = Date.now() * 2 * Math.PI / 10000; // Full rotation in 10 seconds
      const distance = cameraDistance || fgRef.current.camera().position.length();
      fgRef.current.cameraPosition({
        x: distance * Math.cos(angle),
        y: distance * Math.sin(angle),
        z: distance
      });
    }, 16);

    return () => {
      clearInterval(interval);
      if (fgRef && fgRef.current && savedCameraPosition) {
        fgRef.current.cameraPosition(
          savedCameraPosition,
          { x: 0, y: 0, z: 0 },
          500
        );
        setSavedCameraPosition(null);
        setCameraDistance(null);
      }
    };
  }, [layout, wiggleMode, cameraDistance, savedCameraPosition]);

  // Add event listener for 'x' key press
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'x' && layout === '3d-force') {
        setWiggleMode(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [layout]);

  // Modify the useEffect for b key handling
  useEffect(() => {
    const handle3DKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'b' && layout === '3d-force' && fgRef.current) {
        setIs3DChessboard(prev => !prev);
        
        const fg = fgRef.current;
        // Create new nodes array with updated positions
        const updatedNodes = [...graphData.nodes].map(node => {
          const file = node.id.charCodeAt(0) - 'a'.charCodeAt(0);
          const rank = parseInt(node.id[1]) - 1;
          
          if (is3DChessboard) {
            // Reset to force-directed positions by removing fixed coordinates
            const { fx, fy, fz, ...rest } = node as any;
            return rest;
          } else {
            // Set fixed chessboard positions
            return {
              ...node,
              fx: (file - 3.5) * 40,
              fy: (rank - 3.5) * 40,
              fz: 0
            };
          }
        });

        // Reconstruct links based on knight's move pattern
        const dirs = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];
        
        const updatedLinks = updatedNodes.flatMap(node => {
          const file = node.id.charCodeAt(0) - 'a'.charCodeAt(0);
          const rank = parseInt(node.id[1]) - 1;
          
          return dirs
            .map(([df, dr]) => {
              const newFile = file + df;
              const newRank = rank + dr;
              
              if (newFile >= 0 && newFile < 8 && newRank >= 0 && newRank < 8) {
                const target = `${files[newFile]}${ranks[newRank]}`;
                return { source: node.id, target };
              }
              return null;
            })
            .filter((link): link is Link => link !== null);
        });

        // Update graph data with new node positions and links
        setGraphData({
          nodes: updatedNodes,
          links: updatedLinks
        });
      }
    };

    window.addEventListener('keydown', handle3DKeyPress);
    return () => window.removeEventListener('keydown', handle3DKeyPress);
  }, [layout, is3DChessboard, graphData]);

  // Apply layout when it changes
  useEffect(() => {
    if (cyRef.current) {
      applyLayout();
    }
  }, [applyLayout]);

  useEffect(() => {
    if (cyRef.current) {
      updateNodeSize();
    }
  }, [nodeSize, updateNodeSize]);

  useEffect(() => {
    if (cyRef.current) {
      updateEdgeStyle();
    }
  }, [edgeStyle, showArrows, updateEdgeStyle]);

  const useCube = false;
  const Force3DGraph = layout === '3d-force' ? (
    <div style={{ width: '100%', height: '100%', border: '1px solid #ccc' }} className="force-graph-3d">
      <ForceGraph3D
        ref={fgRef}
        graphData={graphData}
        enableNodeDrag={true}
        onNodeDragEnd={node => {
          // When node dragging ends, update node's fixed position
          node.fx = node.x;
          node.fy = node.y;
          node.fz = node.z;
        }}
        showNavInfo={false}
        nodeLabel="id"
        backgroundColor="#ffffff"
        linkColor={() => '#112233'} // #8B4513 is saddlebrown
        linkWidth={1.05}
        onEngineTick={() => {
          if (fgRef.current) {
            const scene = fgRef.current.scene();
            const camera = fgRef.current.camera();
            if (!scene.userData.lightsSetup) {
              setupLights(scene, camera);
              scene.userData.lightsSetup = true;
            }
          }
        }}
        nodeThreeObject={node => {
          const geometry = useCube ? 
            new BoxGeometry(nodeSize / 10, nodeSize / 10, nodeSize / 10) :
            new SphereGeometry(nodeSize / 10);
            
          const sphere = new Mesh(
            geometry,
            new MeshPhongMaterial({
              color: node.isDark ? '#B58863' : '#F0D9B5',
              //transparent: true,
              //opacity: 0.5,
              side: DoubleSide,
              shininess: 80,
              specular: 0x444444
            })
          );
          
          const label = new SpriteText(node.id as string);
          //label.color = '#000000';
          label.color = node.isDark ? '#FFFFFF' : '#000000';
          label.fontWeight = 'bold';
          label.textHeight = nodeSize / 10;
          label.renderOrder = 2;
          label.material.depthTest = false;
          label.material.depthWrite = false;

          // Add opacity update function
          const updateOpacity = () => {
            if (!fgRef.current) return;
            const camera = fgRef.current.camera();
            const distance = camera.position.distanceTo(sphere.position);
            const maxDistance = 600; // Adjust this value based on your graph scale
            const opacity = Math.max(0.5, 1 - (distance / maxDistance));
            label.material.opacity = opacity;
          };

          // Add the update function to the sprite
          label.onBeforeRender = updateOpacity;
          
          sphere.add(label);
          return sphere;
        }}
      />
    </div>
  ) : null;

  useEffect(() => {
    if (!fgRef.current) return;
    
    const controls = fgRef.current.controls();
    if (layout === '3d-force' && controls) {
      
      controls.autoRotate = wiggleMode;
      controls.autoRotateSpeed = 0.5;
      if (!wiggleMode) {
        controls.enableDamping = true;
        controls.dampingFactor = 0.1;
      }
    }
  }, [layout, wiggleMode]);

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
          <option value="breadthfirst">Breadthfirst (grid)</option>
          <option value="breadthfirst-circle">Breadthfirst (circle)</option>
          <option value="cola">Cola</option>
          <option value="concentric">Concentric</option>
          <option value="cose">Cose</option>
          <option value="cose-bilkent">Cose-Bilkent</option>
          <option value="dagre">Dagre</option>
          <option value="elk-box">Box (ELK)</option>
          {/*<option value="elk-disco">Disco (ELK)</option>*/}
          <option value="elk-layered">Layered (ELK)</option>
          <option value="elk-mrtree">MrTree (ELK)</option>
          <option value="elk-stress">Stress (ELK)</option>
          <option value="klay">Klay</option>
          <option value="cise-whole">CiSE (whole)</option>
          <option value="cise-quarters">CiSE (quarters)</option>
          <option value="cise-colors">CiSE (black/white)</option>
          <option value="cise-ranks">CiSE (ranks)</option>
          <option value="cise-singles">CiSE (singles)</option>
        </select>
      </div>
      <div className="mb-4 text-center">
        <label htmlFor="edge-style-select" className="mr-2">Edge Style:</label>
        <select
          id="edge-style-select"
          value={edgeStyle}
          onChange={(e) => setEdgeStyle(e.target.value as typeof edgeStyle)}
          className="border rounded px-2 py-1"
        >
          <option value="straight">Straight</option>
          {/*<option value="bezier">Bezier</option>*/}
          <option value="unbundled-bezier">Unbundled Bezier</option>
          <option value="taxi">Taxi (Horizontal)</option>
          <option value="taxi-vertical">Taxi (Vertical)</option>
          <option value="segments">Segments</option>
          <option value="haystack">Haystack</option>
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
      <div className="mb-4 text-center">
        <label htmlFor="node-size-slider" className="mr-2">Node Size:</label>
        <input
          type="range"
          id="node-size-slider"
          min="10"
          max="200"
          value={nodeSize}
          onChange={(e) => setNodeSize(Number(e.target.value))}
          className="border rounded px-2 py-1"
        />
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