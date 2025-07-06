import React, { useState } from 'react';
import { Plus, UserPlus, BookUser, Users2, ClipboardList } from 'lucide-react';

const SpeedDial = ({ onAddActivity, onAddLead, onAddClient, onAddContact }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="fixed bottom-24 right-6 z-40">
            <div className="flex flex-col items-center space-y-4">
                {isOpen && (
                    <>
                        <button onClick={() => { onAddContact(); setIsOpen(false); }} className="bg-purple-600 hover:bg-purple-700 text-white rounded-full p-3 shadow-lg flex items-center" title="Add New Contact">
                            <Users2 className="w-6 h-6"/>
                        </button>
                        <button onClick={() => { onAddClient(); setIsOpen(false); }} className="bg-green-600 hover:bg-green-700 text-white rounded-full p-3 shadow-lg flex items-center" title="Add New Client">
                            <BookUser className="w-6 h-6"/>
                        </button>
                        <button onClick={() => { onAddLead(); setIsOpen(false); }} className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg flex items-center" title="Add New Lead">
                            <UserPlus className="w-6 h-6"/>
                        </button>
                        <button onClick={() => { onAddActivity(); setIsOpen(false); }} className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg flex items-center" title="Log General Activity">
                            <ClipboardList className="w-6 h-6"/>
                        </button>
                    </>
                )}
                <button onClick={() => setIsOpen(!isOpen)} className="bg-amber-500 hover:bg-amber-600 text-white rounded-full p-4 shadow-lg transition-transform transform hover:scale-110">
                    <Plus className={`w-8 h-8 transition-transform ${isOpen ? 'rotate-45' : ''}`}/>
                </button>
            </div>
        </div>
    );
};

export default SpeedDial;
