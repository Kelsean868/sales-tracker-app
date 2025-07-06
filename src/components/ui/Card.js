import React from 'react';

const Card = ({ children, className = '', onClick = null }) => (
    <div onClick={onClick} className={`bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 ${className} ${onClick ? 'cursor-pointer hover:bg-gray-700' : ''}`}>
        {children}
    </div>
);

export default Card;
