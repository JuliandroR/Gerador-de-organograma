import { Handle, Position, NodeProps } from '@xyflow/react';
import { User } from 'lucide-react';

export function MemberNode({ data, selected }: NodeProps) {
  const { label, role, imageUrl } = data as any;
  
  return (
    <div 
      className={`px-4 py-3 shadow-md rounded-lg bg-white border-2 transition-all ${
        selected ? 'border-[#34cdd7] shadow-lg ring-4 ring-[#34cdd7]/20' : 'border-gray-200 hover:border-gray-300'
      } flex items-center gap-3 w-64 cursor-pointer`}
    >
      <Handle 
        type="target" 
        position={Position.Top} 
        className="w-16 h-2 !bg-[#ccf2f5] hover:!bg-[#34cdd7] !border-0 transition-colors !rounded" 
      />
      
      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center border border-gray-200">
        {imageUrl ? (
          <img src={imageUrl} alt={label} className="w-full h-full object-cover" />
        ) : (
          <User className="text-gray-400 w-6 h-6" />
        )}
      </div>
      
      <div className="overflow-hidden flex-1">
        <div className="text-sm font-bold text-[#1d3c55] truncate" title={label}>{label || 'Membro Sem Nome'}</div>
        <div className="text-xs text-[#34cdd7] font-medium truncate mt-0.5" title={role}>{role || 'Sem Cargo Atribuído'}</div>
      </div>
      
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="w-16 h-2 !bg-gray-200 hover:!bg-[#34cdd7] !border-0 transition-colors !rounded" 
      />
    </div>
  );
}
