import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Block } from '../../types';
import { BlockCard } from '../blocks/BlockCard';
import { ReactNode } from 'react';

interface SortableBlockItemProps {
  block: Block;
  isSelected: boolean;
  children: ReactNode;
  showConnector?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
}

export const SortableBlockItem = ({ block, isSelected, children, isFirst, isLast }: SortableBlockItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 999 : 'auto',
    position: 'relative' as const,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="relative mb-0">
      <BlockCard
        block={block}
        isSelected={isSelected}
        onClick={() => {}} // Click handling is done in parent via children wrapper to capture Shift key
        dragHandleProps={listeners}
        isFirst={isFirst}
        isLast={isLast}
      >
        {children}
      </BlockCard>
    </div>
  );
};
