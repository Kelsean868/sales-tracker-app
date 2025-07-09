import React from 'react';
import { Filter, ChevronDown } from 'lucide-react';

const FilterSortPanel = ({ filterOptions, sortOptions, filter, setFilter, sort, setSort }) => {
    return (
        <div className="bg-gray-800 p-3 rounded-lg flex items-center justify-between">
            <div className="flex items-center space-x-4">
                <Filter size={20} className="text-amber-400" />
                {filterOptions.map(option => (
                    <FilterDropdown 
                        key={option.name}
                        label={option.label}
                        name={option.name}
                        value={filter[option.name] || 'all'}
                        options={option.options}
                        onChange={(e) => setFilter({ ...filter, [option.name]: e.target.value })}
                    />
                ))}
            </div>
            <div className="flex items-center space-x-2">
                <span className="text-sm font-semibold">Sort by:</span>
                <SortDropdown
                    value={sort.field}
                    onChange={(e) => setSort({ ...sort, field: e.target.value })}
                    options={sortOptions}
                />
                <button 
                    onClick={() => setSort({ ...sort, direction: sort.direction === 'asc' ? 'desc' : 'asc' })}
                    className="p-1 rounded-md hover:bg-gray-700"
                >
                    <ChevronDown size={20} className={`transition-transform ${sort.direction === 'asc' ? 'rotate-180' : ''}`} />
                </button>
            </div>
        </div>
    );
};

const FilterDropdown = ({ label, name, value, options, onChange }) => (
    <div className="flex items-center space-x-2">
        <label htmlFor={name} className="text-sm text-gray-400">{label}:</label>
        <select 
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            className="bg-gray-700 border-gray-600 rounded-md p-1 pl-2 pr-8 text-sm focus:ring-amber-500 focus:border-amber-500"
        >
            <option value="all">All</option>
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
    </div>
);

const SortDropdown = ({ value, onChange, options }) => (
    <select
        value={value}
        onChange={onChange}
        className="bg-gray-700 border-gray-600 rounded-md p-1 pl-2 pr-8 text-sm focus:ring-amber-500 focus:border-amber-500"
    >
        {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
    </select>
);

export default FilterSortPanel;