import React, { useState } from "react";
import { FaTrashAlt, FaEllipsisV } from "react-icons/fa";
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

interface SortableTrackProps {
  track: Track;
  index: number;
  onRemove: (trackId: string) => void;
  isDeleting: boolean;
  isCurrent: boolean;
}

const SortableTrack: React.FC<SortableTrackProps> = ({ 
  track, 
  index, 
  onRemove, 
  isDeleting, 
  isCurrent 
}) => {
  const [showMenu, setShowMenu] = useState(false);
  
  // КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ: Используем _id вместо id
  const trackId = track._id || track.id || index.toString();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: trackId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
    opacity: isDragging || isDeleting ? 0.5 : 1,
  };

  const handleRemove = (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.stopPropagation();
    // Передаем правильный внутренний _id
    const trackIdToRemove = track._id?.toString() || track.id?.toString();
    if (trackIdToRemove) {
      onRemove(trackIdToRemove);
    }
    setShowMenu(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        relative overflow-hidden border-b border-white/10
        transition-all duration-300 group
        ${isCurrent ? "bg-indigo-500/20 border-l-4 border-indigo-500" : "bg-transparent"}
        ${isDragging ? "shadow-2xl bg-gray-800" : ""}
      `}
    >
      {/* Tailwind linter false positive - bg-gradient-to-r is correct */}
      <div 
        className={`
          absolute inset-y-0 right-0 w-28 bg-linear-to-r from-red-600 to-red-500 flex items-center justify-center
          transition-transform duration-300 ease-in-out z-0
          ${showMenu ? "translate-x-0" : "translate-x-full"}
        `}
      >
        <button
          onClick={handleRemove}
          disabled={isDeleting}
          className="w-full h-full flex flex-col items-center justify-center text-white gap-1 hover:from-red-500 hover:to-red-400 active:scale-95 disabled:opacity-50 transition-all"
        >
          <FaTrashAlt size={18} />
          <span className="text-[10px] font-black uppercase">Удалить</span>
        </button>
      </div>

      <div
        className={`
          flex items-center gap-4 p-4 transition-transform duration-300 ease-in-out
          ${showMenu ? "-translate-x-24" : "translate-x-0"}
        `}
      >
        <div 
          {...attributes} 
          {...listeners} 
          className="flex flex-1 items-center gap-4 cursor-grab active:cursor-grabbing min-w-0"
        >
          {isCurrent ? (
            <div className="flex items-center gap-2 min-w-[30px]">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-green-400 font-bold text-xs">Сейчас</span>
            </div>
          ) : (
            <span className="text-blue-400 font-bold text-lg min-w-[30px]">
              {index + 1}
            </span>
          )}
          <div className="flex-1 min-w-0">
            <p className={`font-semibold text-sm truncate uppercase tracking-tight ${isCurrent ? "text-green-400" : "text-white"}`}>
              {track.title || "YouTube Video"}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowMenu(!showMenu)}
          className={`
            relative z-10 p-2.5 rounded-lg transition-all active:scale-95
            ${showMenu 
              ? "bg-white/10 text-white rotate-90" 
              : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          title={showMenu ? "Закрыть меню" : "Открыть меню"}
        >
          <FaEllipsisV size={14} />
        </button>
      </div>
    </div>
  );
};

interface PassengerPlaylistProps {
  playlist: Track[];
  currentIndex?: number;
  onRemoveTrack?: (trackId: string) => Promise<void>;
  onMoveTrack?: (fromIndex: number, toIndex: number) => Promise<void>;
}

const PassengerPlaylist: React.FC<PassengerPlaylistProps> = ({ 
  playlist, 
  currentIndex = 0, 
  onRemoveTrack, 
  onMoveTrack 
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: DragEndEvent): Promise<void> => {
    const { active, over } = event;
    if (!active || !over || active.id === over.id) return;

    // Ищем индексы по _id или id
    const oldIndex = playlist.findIndex((t, i) => {
      const id = t._id?.toString() || t.id?.toString() || i.toString();
      return id === active.id.toString();
    });
    const newIndex = playlist.findIndex((t, i) => {
      const id = t._id?.toString() || t.id?.toString() || i.toString();
      return id === over.id.toString();
    });
    
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

    if (onMoveTrack) {
      await onMoveTrack(oldIndex, newIndex);
    }
  };

  const handleRemove = async (trackId: string): Promise<void> => {
    if (!trackId) {
      console.error("❌ Отсутствует trackId");
      return;
    }
    
    if (onRemoveTrack) {
      await onRemoveTrack(trackId);
    }
  };

  return (
    <div className="bg-transparent">
      {playlist.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            // Сопоставляем элементы по _id
            items={playlist.map((t, i) => t._id?.toString() || t.id?.toString() || i.toString())}
            strategy={verticalListSortingStrategy}
          >
            {playlist.map((track, index) => (
              <SortableTrack
                key={track._id?.toString() || track.id?.toString() || index}
                track={track}
                index={index}
                isCurrent={index === currentIndex}
                onRemove={handleRemove}
                isDeleting={false}
              />
            ))}
          </SortableContext>
        </DndContext>
      ) : (
        <div className="text-center py-16 border border-white/10">
          <p className="text-white/40 text-lg font-bold uppercase tracking-[0.2em]">
            Очередь пуста
          </p>
        </div>
      )}
    </div>
  );
};

export default PassengerPlaylist;