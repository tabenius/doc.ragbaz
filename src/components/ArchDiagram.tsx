import { useEffect, useRef, useState, useCallback } from 'react';

import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';

cytoscape.use(dagre);

type ArchNode = {
  id: string;
  label: string;
  layer: string;
};

type ArchEdge = {
  source: string;
  target: string;
  label?: string;
  encrypted?: boolean;
  mandatory: boolean;
};

type ArchLayer = {
  id: string;
  label: string;
};

type ArchDiagramProps = {
  nodes: ArchNode[];
  edges: ArchEdge[];
  layers: ArchLayer[];
  title?: string;
};

const LAYER_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  port: { bg: '#2a1f1e', border: '#ea6962', text: '#ea6962' },
  protocol: { bg: '#1e2328', border: '#7ab8ff', text: '#7ab8ff' },
  encryption: { bg: '#1e2822', border: '#a9b665', text: '#a9b665' },
};

const LAYOUTS = [
  { id: 'dagre', label: 'Dagre' },
  { id: 'circle', label: 'Circle' },
  { id: 'concentric', label: 'Concentric' },
  { id: 'breadthfirst', label: 'Breadth-first' },
  { id: 'cose', label: 'Force' },
  { id: 'grid', label: 'Grid' },
];

const cyStyles: cytoscape.StylesheetCSS[] = [
  {
      selector: 'node[type="layer"]',
      css: {
      'background-color': '#242221',
      'border-color': '#4a4744',
      'border-width': 1,
      'border-style': 'solid',
      color: '#c7bfb3',
      'font-family': '"Intel One Mono", "JetBrains Mono", monospace',
      'font-size': 13,
      'text-valign': 'top',
      'text-halign': 'center',
      padding: '16px',
      'padding-top': '28px',
      shape: 'round-rectangle',
      'border-opacity': 0.5,
      'text-margin-y': -12,
      'font-weight': 'bold',
      'text-transform': 'uppercase',
      'text-wrap': 'wrap',
    },
  },
  {
    selector: 'node[node-encryption]',
    css: {
      'background-color': '#1e2822',
      'border-color': '#a9b665',
      'border-width': 2,
      color: '#a9b665',
    },
  },
  {
    selector: 'node[node-port]',
    css: {
      'background-color': '#2a1f1e',
      'border-color': '#ea6962',
      'border-width': 2,
      color: '#f0ece4',
    },
  },
  {
    selector: 'node[node-protocol]',
    css: {
      'background-color': '#1e2328',
      'border-color': '#7ab8ff',
      'border-width': 2,
      color: '#f0ece4',
    },
  },
  {
    selector: 'node:childless',
    css: {
      width: 120,
      height: 40,
      shape: 'round-rectangle',
      'text-valign': 'center',
      'text-halign': 'center',
      'font-family': '"Intel One Mono", "JetBrains Mono", monospace',
      'font-size': 12,
      'background-opacity': 0.9,
      'border-opacity': 0.7,
    },
  },
  {
    selector: 'edge.mandatory',
    css: {
      width: 2,
      'line-color': '#7ab8ff',
      'target-arrow-color': '#7ab8ff',
      'target-arrow-shape': 'triangle',
      'curve-style': 'bezier',
      opacity: 0.8,
    },
  },
  {
    selector: 'edge.optional',
    css: {
      width: 2,
      'line-color': '#d8a657',
      'target-arrow-color': '#d8a657',
      'target-arrow-shape': 'triangle',
      'line-style': 'dashed',
      'curve-style': 'bezier',
      opacity: 0.7,
    },
  },
  {
    selector: 'edge[encrypted]',
    css: {
      'line-color': '#a9b665',
      'target-arrow-color': '#a9b665',
    },
  },
  {
    selector: 'edge',
    css: {
      'font-family': '"Intel One Mono", "JetBrains Mono", monospace',
      'font-size': 10,
      color: '#9e9487',
      'text-background-color': '#1d1c1b',
      'text-background-opacity': 1,
      'text-background-padding': '3px',
      'text-rotation': 'autorotate',
      label: 'data(label)',
    },
  },
  {
    selector: 'node:selected',
    css: {
      'border-color': '#f3c46c',
      'border-width': 3,
    },
  },
  {
    selector: 'edge:selected',
    css: {
      'line-color': '#f3c46c',
      width: 3,
    },
  },
];

function makeElements(nodes: ArchNode[], edges: ArchEdge[], layers: ArchLayer[]) {
  const cyNodes: cytoscape.ElementDefinition[] = layers.map((l) => ({
    group: 'nodes',
    data: { id: l.id, label: l.label, type: 'layer' },
    classes: `layer-${l.id}`,
  }));

  for (const n of nodes) {
    cyNodes.push({
      group: 'nodes',
      data: {
        id: n.id,
        label: n.label,
        parent: `layer-${n.layer}`,
      },
      classes: `node-${n.layer}`,
    });
  }

  const cyEdges: cytoscape.ElementDefinition[] = edges.map((e) => ({
    group: 'edges',
    data: {
      id: `${e.source}-${e.target}`,
      source: e.source,
      target: e.target,
      label: e.label || '',
      encrypted: e.encrypted ? 'true' : undefined,
    },
    classes: e.mandatory ? 'mandatory' : 'optional',
  }));

  return [...cyNodes, ...cyEdges];
}

export default function ArchDiagram({ nodes, edges, layers, title }: ArchDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [layout, setLayout] = useState('dagre');
  const [selected, setSelected] = useState<string | null>(null);

  const applyLayout = useCallback((cy: cytoscape.Core, name: string) => {
    const opts: Record<string, any> = {
      dagre: { name: 'dagre', rankDir: 'TB', padding: 40, spacingFactor: 1.2 },
      circle: { name: 'circle', padding: 40 },
      concentric: { name: 'concentric', padding: 40 },
      breadthfirst: { name: 'breadthfirst', directed: true, padding: 40 },
      cose: { name: 'cose', padding: 40, nodeRepulsion: () => 8000, idealEdgeLength: () => 120 },
      grid: { name: 'grid', padding: 40 },
    };
    cy.layout(opts[name] || opts.dagre).run();
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    if (cyRef.current) cyRef.current.destroy();

    const cy = cytoscape({
      container: containerRef.current,
      elements: makeElements(nodes, edges, layers),
      style: cyStyles,
      layout: { name: 'preset' },
      minZoom: 0.3,
      maxZoom: 3,
      wheelSensitivity: 0.3,
    });

    cyRef.current = cy;
    applyLayout(cy, layout);

    cy.on('select', 'node', (evt) => setSelected(evt.target.id()));
    cy.on('unselect', 'node', () => setSelected(null));

    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  }, [nodes, edges, layers, layout, applyLayout]);

  return (
    <div
      style={{
        background: '#1d1c1b',
        border: '1px solid #4a4744',
        borderRadius: 4,
        marginBottom: 24,
        overflow: 'hidden',
      }}
    >
      {title && (
        <div
          style={{
            padding: '10px 16px',
            borderBottom: '1px solid #4a4744',
            fontFamily: '"Intel One Mono", "JetBrains Mono", monospace',
            fontSize: 13,
            color: '#f3c46c',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          {title}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          padding: '8px 12px',
          borderBottom: '1px solid #3a3735',
          background: '#242221',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontFamily: '"Intel One Mono", "JetBrains Mono", monospace',
            fontSize: 11,
            color: '#9e9487',
            marginRight: 6,
          }}
        >
          Layout:
        </span>
        {LAYOUTS.map((l) => (
          <button
            key={l.id}
            onClick={() => setLayout(l.id)}
            style={{
              background: layout === l.id ? '#353332' : 'transparent',
              color: layout === l.id ? '#f3c46c' : '#c7bfb3',
              border: '1px solid',
              borderColor: layout === l.id ? '#f3c46c' : '#4a4744',
              borderRadius: 2,
              padding: '3px 10px',
              cursor: 'pointer',
              fontFamily: '"Intel One Mono", "JetBrains Mono", monospace',
              fontSize: 11,
            }}
          >
            {l.label}
          </button>
        ))}

        <div style={{ flex: 1 }} />
        <span
          style={{
            fontFamily: '"Intel One Mono", "JetBrains Mono", monospace',
            fontSize: 11,
            color: '#9e9487',
          }}
        >
          {selected ? `Selected: ${selected}` : 'Click a node to inspect'}
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 14,
          padding: '6px 14px',
          borderBottom: '1px solid #3a3735',
          background: '#1a1918',
          fontFamily: '"Intel One Mono", "JetBrains Mono", monospace',
          fontSize: 11,
        }}
      >
        {layers.map((l) => {
          const c = LAYER_COLORS[l.id] || { text: '#9e9487', border: '#4a4744' };
          return (
            <span key={l.id} style={{ color: c.text, display: 'flex', alignItems: 'center', gap: 5 }}>
              <span
                style={{
                  display: 'inline-block',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: c.border,
                }}
              />
              {l.label}
            </span>
          );
        })}
        <span style={{ color: '#9e9487', display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ display: 'inline-block', width: 16, height: 0, borderTop: '2px solid #7ab8ff' }} />
          Mandatory
        </span>
        <span style={{ color: '#9e9487', display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ display: 'inline-block', width: 16, height: 0, borderTop: '2px dashed #d8a657' }} />
          Optional
        </span>
        <span style={{ color: '#a9b665', display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#a9b665' }} />
          Encrypted
        </span>
      </div>

      <div ref={containerRef} style={{ width: '100%', height: 520 }} />
    </div>
  );
}
