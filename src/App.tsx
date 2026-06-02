import { useCallback, useState, useRef, useEffect } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  Panel,
  Node,
  Edge,
  Connection,
  useReactFlow,
  MiniMap
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { v4 as uuidv4 } from 'uuid';
import { toPng, toJpeg } from 'html-to-image';
import jsPDF from 'jspdf';
import { Download, Image as ImageIcon, FileText, Plus, Users, Trash2, LayoutTemplate } from 'lucide-react';

import { MemberNode } from './components/MemberNode';
import { getLayoutedElements } from './lib/layout';

const nodeTypes = {
  member: MemberNode,
};

const initialNodes: Node[] = [
  {
    id: 'ceo',
    type: 'member',
    position: { x: 0, y: 0 },
    data: { label: 'Ana Silva', role: 'CEO', imageUrl: 'https://i.pravatar.cc/150?u=sarah' },
  },
  {
    id: 'cto',
    type: 'member',
    position: { x: -150, y: 150 },
    data: { label: 'João Souza', role: 'Diretor de Tecnologia', imageUrl: 'https://i.pravatar.cc/150?u=john' },
  },
  {
    id: 'cmo',
    type: 'member',
    position: { x: 150, y: 150 },
    data: { label: 'Amanda Costa', role: 'Diretora de Marketing', imageUrl: 'https://i.pravatar.cc/150?u=amanda' },
  },
];

const initialEdges: Edge[] = [
  { id: 'e-ceo-cto', source: 'ceo', target: 'cto', animated: true, style: { strokeWidth: 2, stroke: '#1d3c55' } },
  { id: 'e-ceo-cmo', source: 'ceo', target: 'cmo', animated: true, style: { strokeWidth: 2, stroke: '#1d3c55' } },
];

function Flow() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { fitView } = useReactFlow();
  
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  // Sync selected node with react flow's internal state
  useEffect(() => {
    const selected = nodes.find(n => n.selected);
    setSelectedNode(selected || null);
  }, [nodes]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true, style: { strokeWidth: 2, stroke: '#1d3c55' } }, eds)),
    [setEdges],
  );

  const onLayout = useCallback(
    (direction: string) => {
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        nodes,
        edges,
        direction
      );
      setNodes([...layoutedNodes]);
      setEdges([...layoutedEdges]);
      setTimeout(() => fitView({ padding: 0.2 }), 50);
    },
    [nodes, edges, setNodes, setEdges, fitView]
  );
  
  // Apply initial layout
  useEffect(() => {
    // Only layout automatically once on mount
    const timeout = setTimeout(() => onLayout('TB'), 100);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addNode = () => {
    // Calculate a position slightly offset from the selected node or center
    const position = selectedNode 
      ? { x: selectedNode.position.x, y: selectedNode.position.y + 120 } 
      : { x: window.innerWidth / 2 - 130, y: window.innerHeight / 2 - 40 };

    const newNode: Node = {
      id: uuidv4(),
      type: 'member',
      position,
      data: { label: 'Novo Membro', role: 'Cargo', imageUrl: '' },
    };

    setNodes((nds) => [...nds, newNode]);
    
    // Automatically connect if there's a selected node
    if (selectedNode) {
      setEdges((eds) => addEdge({ 
        id: uuidv4(), 
        source: selectedNode.id, 
        target: newNode.id,
        animated: true,
        style: { strokeWidth: 2, stroke: '#1d3c55' }
      }, eds));
    }
  };

  const updateSelectedNode = (field: string, value: string) => {
    if (!selectedNode) return;
    
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === selectedNode.id) {
          n.data = { ...n.data, [field]: value };
        }
        return n;
      })
    );
  };

  const deleteSelectedNode = () => {
    if (!selectedNode) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
    setEdges((eds) => eds.filter(e => e.source !== selectedNode.id && e.target !== selectedNode.id));
    setSelectedNode(null);
  };

  const downloadImage = async (format: 'png' | 'jpeg') => {
    const el = document.querySelector('.react-flow__viewport') as HTMLElement;
    if (!el) return;
    
    // Briefly force fitview to ensure everything is rendered
    fitView({ padding: 0.2, duration: 200 });
    
    setTimeout(async () => {
      try {
        const dataUrl = format === 'png' 
          ? await toPng(el, { backgroundColor: 'transparent' })
          : await toJpeg(el, { backgroundColor: '#f5f6fb', quality: 0.95 });
          
        const a = document.createElement('a');
        a.setAttribute('download', `org-chart.${format}`);
        a.setAttribute('href', dataUrl);
        a.click();
      } catch (err) {
        console.error('Failed to export image', err);
      }
    }, 300);
  };

  const downloadPdf = async () => {
    const el = document.querySelector('.react-flow__viewport') as HTMLElement;
    if (!el) return;
    
    fitView({ padding: 0.2, duration: 200 });
    
    setTimeout(async () => {
      try {
        const dataUrl = await toPng(el, { backgroundColor: '#ffffff' });
        
        // Create PDF
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'px',
          format: 'a4'
        });
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        // Use an image to calculate scaling
        const img = new Image();
        img.src = dataUrl;
        img.onload = () => {
          const ratio = Math.min(pdfWidth / img.width, pdfHeight / img.height);
          const drawWidth = img.width * ratio;
          const drawHeight = img.height * ratio;
          const offsetX = (pdfWidth - drawWidth) / 2;
          const offsetY = (pdfHeight - drawHeight) / 2;
          
          pdf.addImage(dataUrl, 'PNG', offsetX, offsetY, drawWidth, drawHeight);
          pdf.save('org-chart.pdf');
        };
      } catch (err) {
        console.error('Failed to export PDF', err);
      }
    }, 300);
  };

  return (
    <div className="w-full h-screen flex bg-[#f5f6fb] overflow-hidden font-sans">
      {/* Left Sidebar - Editing Controls */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col shadow-sm z-10 relative">
        <div className="p-6 border-b border-gray-100 bg-[#ccf2f5]/50">
          <h1 className="text-xl font-bold text-[#1d3c55] flex items-center gap-2">
            <Users className="text-[#34cdd7]" />
            Gerador de Organograma
          </h1>
          <p className="text-xs text-gray-500 mt-2">
            Organize os membros naturalmente arrastando para conectar relações de subordinação.
          </p>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {selectedNode ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
              <div className="flex justify-between items-center">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Editar Membro</h2>
                <button 
                  onClick={deleteSelectedNode}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                  title="Remover Membro"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                  <input
                    type="text"
                    value={selectedNode.data.label as string}
                    onChange={(e) => updateSelectedNode('label', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#34cdd7] focus:border-[#34cdd7] transition-shadow"
                    placeholder="Ex. Maria Silva"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cargo / Função</label>
                  <input
                    type="text"
                    value={selectedNode.data.role as string}
                    onChange={(e) => updateSelectedNode('role', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#34cdd7] focus:border-[#34cdd7] transition-shadow"
                    placeholder="Ex. Gerente de Engenharia"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL da Foto de Perfil <span className="text-gray-400 font-normal">(Opcional)</span></label>
                  <input
                    type="url"
                    value={selectedNode.data.imageUrl as string || ''}
                    onChange={(e) => updateSelectedNode('imageUrl', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#34cdd7] focus:border-[#34cdd7] transition-shadow"
                    placeholder="https://..."
                  />
                  {selectedNode.data.imageUrl && (
                    <div className="mt-3 flex justify-center">
                      <img src={selectedNode.data.imageUrl as string} alt="Preview" className="w-16 h-16 rounded-full border border-gray-200 object-cover shadow-sm bg-gray-50" onError={(e) => (e.currentTarget.style.display = 'none')} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 text-[#1d3c55]/40">
              <Users size={48} strokeWidth={1} />
              <p className="text-sm px-4">Clique em qualquer membro no quadro para editar seus detalhes ou atribuir funções.</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 bg-[#f5f6fb] space-y-3">
          <button
            onClick={addNode}
            className="w-full py-2.5 px-4 bg-[#1d3c55] hover:bg-[#1d3c55]/90 text-white font-medium rounded-md shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            {selectedNode ? 'Adicionar Subordinado' : 'Adicionar Novo Membro'}
          </button>
          <button
            onClick={() => onLayout('TB')}
            className="w-full py-2 px-4 bg-white hover:bg-[#f5f6fb] border border-gray-200 text-[#1d3c55] font-medium rounded-md shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            <LayoutTemplate size={18} />
            Organizar e Alinhar
          </button>
          
          <div className="pt-4 mt-2 border-t border-gray-200">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">Exportar Organograma</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => downloadImage('png')}
                className="py-2 px-3 bg-white hover:bg-[#f5f6fb] border border-gray-200 text-[#1d3c55] text-sm font-medium rounded-md shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                <ImageIcon size={16} />
                PNG
              </button>
              <button
                onClick={downloadPdf}
                className="py-2 px-3 bg-white hover:bg-[#f5f6fb] border border-gray-200 text-[#1d3c55] text-sm font-medium rounded-md shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                <FileText size={16} />
                PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 relative cursor-grab active:cursor-grabbing">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.2}
          attributionPosition="bottom-right"
          className="bg-[#f5f6fb]"
        >
          <Background color="#cbd5e1" gap={20} size={2} />
          <Controls className="bg-white border-gray-200 shadow-sm rounded-md overflow-hidden !m-6" />
          <MiniMap className="!bg-white !rounded-lg !shadow-sm !border !border-gray-200 !w-36 !h-24 !m-6" maskColor="rgba(245, 246, 251, 0.6)" />
        </ReactFlow>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <Flow />
    </ReactFlowProvider>
  );
}
