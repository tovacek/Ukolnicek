
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CalendarEvent } from '../types';
import { X, Plus, Trash2, Calendar, Clock, Check } from 'lucide-react';

interface ScheduleModalProps {
    childId: string;
    onClose: () => void;
    isReadOnly?: boolean; // If parent wants to restrict (though request says parent can add too)
}

const ScheduleModal: React.FC<ScheduleModalProps> = ({ childId, onClose }) => {
    const { calendarEvents, addCalendarEvent, deleteCalendarEvent, familyId, users } = useApp();
    const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay() || 7); // 1-7 (Mon-Sun)
    
    // Add Event State
    const [isAdding, setIsAdding] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newTime, setNewTime] = useState('14:00');
    const [newColor, setNewColor] = useState('bg-blue-100 text-blue-700');

    const days = [
        { id: 1, label: 'Po', full: 'Pondělí' },
        { id: 2, label: 'Út', full: 'Úterý' },
        { id: 3, label: 'St', full: 'Středa' },
        { id: 4, label: 'Čt', full: 'Čtvrtek' },
        { id: 5, label: 'Pá', full: 'Pátek' },
        { id: 6, label: 'So', full: 'Sobota' },
        { id: 7, label: 'Ne', full: 'Neděle' },
    ];

    const colors = [
        { class: 'bg-blue-100 text-blue-700', label: 'Modrá' },
        { class: 'bg-green-100 text-green-700', label: 'Zelená' },
        { class: 'bg-yellow-100 text-yellow-700', label: 'Žlutá' },
        { class: 'bg-red-100 text-red-700', label: 'Červená' },
        { class: 'bg-purple-100 text-purple-700', label: 'Fialová' },
        { class: 'bg-orange-100 text-orange-700', label: 'Oranžová' },
    ];

    const childName = users.find(u => u.id === childId)?.name || 'Dítě';
    const eventsForDay = calendarEvents.filter(e => e.childId === childId && e.dayIndex === selectedDay).sort((a,b) => a.time.localeCompare(b.time));

    const handleAdd = () => {
        if (!newTitle.trim() || !familyId) return;
        
        const newEvent: CalendarEvent = {
            id: Math.random().toString(36).substr(2, 9),
            familyId,
            childId,
            title: newTitle,
            dayIndex: selectedDay,
            time: newTime,
            color: newColor
        };
        
        addCalendarEvent(newEvent);
        setIsAdding(false);
        setNewTitle('');
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white w-full max-w-lg rounded-[2rem] p-6 shadow-2xl relative flex flex-col h-[85vh]">
                
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-display font-bold text-slate-800 flex items-center gap-2">
                        <Calendar className="text-brand-blue" /> Rozvrh - {childName}
                    </h3>
                    <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                        <X size={20} />
                    </button>
                </div>

                {/* Days Tabs */}
                <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 overflow-x-auto">
                    {days.map(day => (
                        <button
                            key={day.id}
                            onClick={() => setSelectedDay(day.id)}
                            className={`flex-1 py-2 px-1 rounded-lg text-sm font-bold transition-all min-w-[40px] ${selectedDay === day.id ? 'bg-white shadow-md text-brand-blue' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {day.label}
                        </button>
                    ))}
                </div>

                {/* Active Day Title */}
                <div className="flex justify-between items-center mb-4 px-1">
                    <h4 className="font-bold text-xl text-slate-700">{days.find(d => d.id === selectedDay)?.full}</h4>
                    <button 
                        onClick={() => setIsAdding(true)} 
                        className="bg-brand-blue text-white p-2 rounded-full shadow-lg hover:bg-blue-600 transition-colors"
                    >
                        <Plus size={20} />
                    </button>
                </div>

                {/* Events List */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                    {isAdding && (
                        <div className="bg-white border-2 border-brand-blue rounded-xl p-4 shadow-sm animate-scale-in">
                             <input 
                                autoFocus
                                type="text" 
                                placeholder="Název kroužku / události" 
                                value={newTitle} 
                                onChange={e => setNewTitle(e.target.value)}
                                className="w-full text-lg font-bold text-slate-800 placeholder-slate-300 mb-3 outline-none"
                             />
                             <div className="flex flex-wrap gap-3 items-center justify-between">
                                 <input 
                                    type="time" 
                                    value={newTime} 
                                    onChange={e => setNewTime(e.target.value)} 
                                    className="bg-gray-50 border rounded-lg p-2 text-sm font-bold text-slate-700"
                                 />
                                 <div className="flex gap-2">
                                     {colors.map(c => (
                                         <button 
                                            key={c.label} 
                                            onClick={() => setNewColor(c.class)}
                                            className={`w-6 h-6 rounded-full border-2 ${c.class.replace('text-', 'border-').split(' ')[0]} ${newColor === c.class ? 'ring-2 ring-offset-1 ring-slate-400' : ''}`}
                                         ></button>
                                     ))}
                                 </div>
                                 <div className="flex gap-2">
                                     <button onClick={() => setIsAdding(false)} className="p-2 text-gray-400 hover:text-red-500"><X size={20}/></button>
                                     <button onClick={handleAdd} disabled={!newTitle.trim()} className="p-2 bg-brand-blue text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"><Check size={20}/></button>
                                 </div>
                             </div>
                        </div>
                    )}

                    {eventsForDay.length === 0 && !isAdding ? (
                        <div className="text-center py-12 text-gray-400 flex flex-col items-center">
                            <Clock size={48} className="mb-4 opacity-20" />
                            <p>Na tento den není nic v plánu.</p>
                            <p className="text-xs mt-2">Užij si volno!</p>
                        </div>
                    ) : (
                        eventsForDay.map(event => (
                            <div key={event.id} className={`p-4 rounded-xl border flex items-center gap-4 relative group ${event.color || 'bg-white border-gray-100'}`}>
                                <div className="font-bold text-slate-500 w-12 text-sm">{event.time}</div>
                                <div className="flex-1 font-bold text-slate-800 text-lg">{event.title}</div>
                                <button 
                                    onClick={() => deleteCalendarEvent(event.id)}
                                    className="p-2 bg-white/50 rounded-full text-slate-400 hover:text-red-500 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ScheduleModal;
