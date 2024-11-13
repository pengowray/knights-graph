'use client'
import React, { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import * as d3 from 'd3';

const KnightsGraph = () => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    // Clear any existing content
    d3.select(svgRef.current).selectAll("*").remove();

    // Generate chess square labels (a1 to h8)
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];
    
    // Create nodes array with labels and calculate their chess square color
    const nodes = [];
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        nodes.push({
          id: `${files[i]}${ranks[j]}`,
          isDark: (i + j) % 2 === 1
        });
      }
    }
    
    // Generate knight's move connections
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
          if (node.id < target) {
            links.push({
              source: node.id,
              target: target
            });
          }
        }
      });
    });

    const width = 600;
    const height = 600; // Made square
    const nodeSize = 15; // Smaller nodes

    // Create SVG container
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    // Create force simulation with adjusted parameters
    const simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(40)) // Reduced distance
      .force('charge', d3.forceManyBody().strength(-100)) // Reduced repulsion
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(nodeSize * 1.2)); // Added small padding

    // Create the links
    const link = svg.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .style('stroke', '#15465C')
      .style('stroke-width', 0.5); // Thinner lines

    // Create the nodes
    const node = svg.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g');

    // Add squares to nodes
    node.append('rect')
      .attr('x', -nodeSize)
      .attr('y', -nodeSize)
      .attr('width', nodeSize * 2)
      .attr('height', nodeSize * 2)
      .style('fill', (d: any) => d.isDark ? '#B58863' : '#F0D9B5') // Chess colors
      .style('stroke', '#262D31')
      .style('stroke-width', 1);

    // Add labels to nodes
    node.append('text')
      .text((d: any) => d.id)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .style('fill', (d: any) => d.isDark ? 'white' : 'black') // Contrast text color
      .style('font-size', '12px')
      .style('font-weight', '500'); // Slightly bold for better readability

    // Add hover interactivity
    node.on('mouseover', function(event, d: any) {
      d3.select(this).select('rect')
        .style('stroke-width', 2)
        .style('stroke', '#4a90e2');
      
      // Highlight connected edges
      link
        .style('stroke-width', (l: any) => 
          l.source.id === d.id || l.target.id === d.id ? 1.5 : 0.5)
        .style('stroke', (l: any) => 
          l.source.id === d.id || l.target.id === d.id ? '#4a90e2' : '#15465C');
    }).on('mouseout', function(event, d: any) {
      d3.select(this).select('rect')
        .style('stroke-width', 1)
        .style('stroke', '#262D31');
      
      // Reset edges
      link
        .style('stroke-width', 0.5)
        .style('stroke', '#15465C');
    });

    // Update positions on each tick of the simulation
    simulation.on('tick', () => {
      // Constrain nodes to the visible area
      nodes.forEach((d: any) => {
        d.x = Math.max(nodeSize, Math.min(width - nodeSize, d.x));
        d.y = Math.max(nodeSize, Math.min(height - nodeSize, d.y));
      });

      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node
        .attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    // Add drag behavior
    node.call(d3.drag()
      .on('start', (event: any) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      })
      .on('drag', (event: any) => {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      })
      .on('end', (event: any) => {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }) as any);

    return () => {
      simulation.stop();
    };
  }, []);

  return (
    <Card className="p-4 w-full max-w-3xl mx-auto">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold">Knight's Move Graph</h2>
        <p className="text-sm text-gray-600">Visualization of possible knight moves on a chess board</p>
      </div>
      <div className="relative w-[600px] h-[600px] mx-auto bg-white rounded-lg">
        <svg 
          ref={svgRef}
          className="border rounded-lg"
          style={{ border: '1px solid #ccc' }}
        />
      </div>
    </Card>
  );
};

export default KnightsGraph;