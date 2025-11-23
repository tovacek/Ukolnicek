
import React, { useState } from 'react';
import Avatar, { genConfig } from 'react-nice-avatar';
import { X, Save, Dice5, User } from 'lucide-react';
import { AvatarConfig } from '../types';

interface AvatarEditorProps {
    currentConfig?: AvatarConfig;
    onSave: (config: AvatarConfig) => void;
    onClose: () => void;
}

const AvatarEditor: React.FC<AvatarEditorProps> = ({ currentConfig, onSave, onClose }) => {
    const [config, setConfig] = useState<AvatarConfig>(currentConfig || genConfig());

    const updateConfig = (key: string, value: any) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    const randomize = () => {
        setConfig(genConfig());
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white w-full max-w-lg rounded-[2rem] p-6 shadow-2xl flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-brand-dark flex items-center gap-2">
                        <User className="text-brand-blue"/> Upravit postavičku
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                        <X size={20} className="text-gray-400"/>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                    
                    {/* Preview Area */}
                    <div className="flex flex-col items-center">
                        <div className="w-48 h-48 rounded-full border-4 border-white shadow-xl overflow-hidden bg-blue-50 relative mb-4">
                            <Avatar style={{ width: '100%', height: '100%' }} {...config} />
                        </div>
                        <button 
                            onClick={randomize}
                            className="px-4 py-2 bg-purple-100 text-purple-700 font-bold rounded-full text-sm flex items-center gap-2 hover:bg-purple-200 transition-colors"
                        >
                            <Dice5 size={16}/> Náhodně
                        </button>
                    </div>

                    {/* Controls Grid */}
                    <div className="grid grid-cols-1 gap-6">
                        
                        {/* 1. Base */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <h4 className="font-bold text-slate-700 mb-3 text-sm uppercase tracking-wider">Základ</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Pohlaví</label>
                                    <select 
                                        value={config.sex} 
                                        onChange={(e) => updateConfig('sex', e.target.value)}
                                        className="w-full p-2 rounded-lg border text-sm"
                                    >
                                        <option value="man">Kluk</option>
                                        <option value="woman">Holka</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Barva pleti</label>
                                    <input 
                                        type="color" 
                                        value={config.faceColor || '#F9C9B6'} 
                                        onChange={(e) => updateConfig('faceColor', e.target.value)}
                                        className="w-full h-9 p-1 rounded-lg border cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 2. Hair */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <h4 className="font-bold text-slate-700 mb-3 text-sm uppercase tracking-wider">Vlasy</h4>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Styl vlasů</label>
                                    <select 
                                        value={config.hairStyle} 
                                        onChange={(e) => updateConfig('hairStyle', e.target.value)}
                                        className="w-full p-2 rounded-lg border text-sm"
                                    >
                                        <option value="normal">Normální</option>
                                        <option value="thick">Husté</option>
                                        <option value="mohawk">Číro</option>
                                        <option value="womanLong">Dlouhé</option>
                                        <option value="womanShort">Mikádo</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Barva vlasů</label>
                                    <input 
                                        type="color" 
                                        value={config.hairColor || '#000000'} 
                                        onChange={(e) => updateConfig('hairColor', e.target.value)}
                                        className="w-full h-9 p-1 rounded-lg border cursor-pointer"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Čepice</label>
                                    <select 
                                        value={config.hatStyle} 
                                        onChange={(e) => updateConfig('hatStyle', e.target.value)}
                                        className="w-full p-2 rounded-lg border text-sm"
                                    >
                                        <option value="none">Žádná</option>
                                        <option value="beanie">Zimní čepice</option>
                                        <option value="turban">Turban</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* 3. Clothes */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <h4 className="font-bold text-slate-700 mb-3 text-sm uppercase tracking-wider">Oblečení</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Styl</label>
                                    <select 
                                        value={config.shirtStyle} 
                                        onChange={(e) => updateConfig('shirtStyle', e.target.value)}
                                        className="w-full p-2 rounded-lg border text-sm"
                                    >
                                        <option value="hoody">Mikina</option>
                                        <option value="short">Tričko</option>
                                        <option value="polo">Polokošile</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Barva</label>
                                    <input 
                                        type="color" 
                                        value={config.shirtColor || '#99CCFF'} 
                                        onChange={(e) => updateConfig('shirtColor', e.target.value)}
                                        className="w-full h-9 p-1 rounded-lg border cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 4. Accessories */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <h4 className="font-bold text-slate-700 mb-3 text-sm uppercase tracking-wider">Doplňky</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Brýle</label>
                                    <select 
                                        value={config.glassesStyle} 
                                        onChange={(e) => updateConfig('glassesStyle', e.target.value)}
                                        className="w-full p-2 rounded-lg border text-sm"
                                    >
                                        <option value="none">Žádné</option>
                                        <option value="round">Kulaté</option>
                                        <option value="square">Hranaté</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Úsměv</label>
                                    <select 
                                        value={config.mouthStyle} 
                                        onChange={(e) => updateConfig('mouthStyle', e.target.value)}
                                        className="w-full p-2 rounded-lg border text-sm"
                                    >
                                        <option value="smile">Úsměv</option>
                                        <option value="laugh">Smích</option>
                                        <option value="peace">Pohoda</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                    <button 
                        onClick={() => onSave(config)}
                        className="w-full py-3.5 bg-brand-green text-white font-bold rounded-xl shadow-lg hover:bg-emerald-600 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        <Save size={20}/> Uložit postavičku
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AvatarEditor;
