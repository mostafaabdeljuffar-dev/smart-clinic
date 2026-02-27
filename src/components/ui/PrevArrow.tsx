import React from 'react';
import { ChevronRight } from 'lucide-react'


interface PrevArrowProps {
    onClick: () => void;
    disabled?: boolean;
}

const PrevArrow: React.FC<PrevArrowProps> = ({ onClick, disabled }) => {
    return (
        <button
            aria-label='Prev'
            onClick={onClick}
            disabled={disabled}
            className={`w-10 h-10 shadow-lg flex items-center justify-center border rounded-xl transition
                        ${
                        disabled
                            ? "bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed opacity-60"
                            : "text-[#122445] bg-white border-[#122445] hover:text-white hover:bg-[#122445] hover:scale-105 cursor-pointer"
                        }`}
        >
            <ChevronRight size={22} />
        </button>
    );
};

export default PrevArrow;
