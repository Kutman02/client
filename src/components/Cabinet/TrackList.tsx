import React, { useState } from "react";
import { FaTrashAlt, FaEllipsisV } from "react-icons/fa";
import { HiPlay } from "react-icons/hi";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  TouchSensor,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Track } from "../../types";

interface SortableTrackItemProps {
  track: Track;
  index: number;
  currentIndex: number;
  onSelect: (index: number) => void;
  onRemove: (index: number) => void;
}

const SortableTrackItem: React.FC<SortableTrackItemProps> = ({ 
  track, 
  index, 
  currentIndex, 
  onSelect, 
  onRemove 
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const isCurrent = index === currentIndex;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: index.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
  };

  const handleRemove = (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.stopPropagation();
    onRemove(index);
    setShowMenu(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative overflow-hidden border-b border-white/5 ${isDragging ? "opacity-50 bg-white/5" : "opacity-100"}`}
    >
      {/* Кнопка удаления */}
      <button
        onClick={handleRemove}
        className={`absolute inset-y-0 right-0 w-24 bg-linear-to-r from-red-600 to-red-500 text-white flex flex-col items-center justify-center transition-transform duration-300 z-10 hover:from-red-500 hover:to-red-400 active:scale-95 ${
          showMenu ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <FaTrashAlt size={16} />
        <span className="text-[9px] font-bold mt-1 uppercase">Удалить</span>
      </button>

      {/* Контент трека */}
      <div
        className={`
          relative flex items-center gap-4 p-3 transition-transform duration-200 bg-transparent
          ${showMenu ? "-translate-x-20" : "translate-x-0"}
          ${isCurrent ? "bg-white/5" : "hover:bg-white/5"}
        `}
      >
        {/* Индикатор/Номер */}
        <div 
          {...attributes} 
          {...listeners}
          className="flex items-center justify-center w-6 cursor-grab active:cursor-grabbing"
        >
          {isCurrent ? (
            <HiPlay className="text-blue-500 animate-pulse" size={18} />
          ) : (
            <span className="text-gray-600 text-xs font-mono">{index + 1}</span>
          )}
        </div>

        {/* Текст */}
        <div 
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => onSelect(index)}
        >
          <p className={`text-sm tracking-wide truncate ${isCurrent ? "text-blue-500 font-bold" : "text-gray-300"}`}>
            {track.title || "БЕЗ НАЗВАНИЯ"}
          </p>
        </div>

        {/* Меню */}
        <button
          onClick={() => setShowMenu(!showMenu)}
          className={`p-2.5 rounded-lg transition-all z-20 active:scale-95 ${
            showMenu 
              ? "text-white bg-white/10 rotate-90" 
              : "text-gray-500 hover:text-white hover:bg-white/5"
          }`}
          title={showMenu ? "Закрыть меню" : "Открыть меню"}
        >
          <FaEllipsisV size={14} />
        </button>
      </div>
    </div>
  );
};

interface TrackListProps {
  playlist: Track[];
  currentIndex: number;
  onSelect: (index: number) => void;
  onRemove: (index: number) => void;
  onMove: (fromIndex: number, toIndex: number) => void;
}

export const TrackList: React.FC<TrackListProps> = ({ 
  playlist, 
  currentIndex, 
  onSelect, 
  onRemove, 
  onMove 
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent): void => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      const oldIndex = parseInt(String(active.id));
      const newIndex = parseInt(String(over.id));
      if (!isNaN(oldIndex) && !isNaN(newIndex)) {
        onMove(oldIndex, newIndex);
      }
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto border-t border-white/10">
      {/* <div className="flex items-center justify-between py-3 px-3">
        <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Очередь</h3>
        <span className="text-[10px] text-gray-600 font-bold uppercase">{playlist.length} треков</span>
      </div> */}

      {playlist.length > 0 ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="flex flex-col border-t border-white/5">
            <SortableContext items={playlist.map((_, i) => i.toString())} strategy={verticalListSortingStrategy}>
              {playlist.map((track, index) => (
                <SortableTrackItem
                  key={index}
                  track={track}
                  index={index}
                  currentIndex={currentIndex}
                  onSelect={onSelect}
                  onRemove={onRemove}
                />
              ))}
            </SortableContext>
          </div>
        </DndContext>
      ) : (
        <div className="py-20 text-center border-t border-white/5">
          <p className="text-gray-700 text-[10px] uppercase tracking-widest font-bold">Список пуст</p>
        </div>
      )}
    </div>
  );
};