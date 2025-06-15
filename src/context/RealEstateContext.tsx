import React, { createContext, useContext, useState, ReactNode } from 'react';
import { RealEstate } from '../types/realEstate';

type RealEstateContextType = {
  realEstates: RealEstate[];
  setRealEstates: (estates: RealEstate[]) => void;
  findEstateById: (id: string) => RealEstate | undefined;
};

const RealEstateContext = createContext<RealEstateContextType | undefined>(undefined);

export const RealEstateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [realEstates, setRealEstates] = useState<RealEstate[]>([]);

  const findEstateById = (id: string): RealEstate | undefined => {
    return realEstates.find(estate => estate.id === id);
  };

  return (
    <RealEstateContext.Provider value={{ realEstates, setRealEstates, findEstateById }}>
      {children}
    </RealEstateContext.Provider>
  );
};

export const useRealEstate = (): RealEstateContextType => {
  const context = useContext(RealEstateContext);
  if (context === undefined) {
    throw new Error('useRealEstate must be used within a RealEstateProvider');
  }
  return context;
};
