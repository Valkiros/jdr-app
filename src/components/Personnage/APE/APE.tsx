import { APETable } from './APETable';
import { ApeEntry } from '../../../types';
import React from 'react';

interface APEProps {
    ape: ApeEntry[];
    onApeChange: (items: ApeEntry[]) => void;
    origin?: string;
}

export const APE: React.FC<APEProps> = ({ ape = [], onApeChange, origin }) => {

    return (
        <div className="space-y-6">
            <APETable
                items={ape}
                onItemsChange={onApeChange}
                origin={origin || ''}
            />
        </div>
    );
};
