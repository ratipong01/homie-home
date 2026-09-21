import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { House } from '../types';
import { houseApi } from '../services/houseApi';
import { useAuth } from './AuthContext';

interface HouseContextValue {
  houses: House[];
  activeHouse: House | null;
  isLoading: boolean;
  selectHouse: (house: House) => void;
  createHouse: (name: string) => Promise<House>;
  refreshHouses: () => Promise<void>;
}

const HouseContext = createContext<HouseContextValue | undefined>(undefined);

export const HouseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const [houses, setHouses] = useState<House[]>([]);
  const [activeHouse, setActiveHouse] = useState<House | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refreshHouses = useCallback(async () => {
    if (!token) {
      setHouses([]);
      setActiveHouse(null);
      return;
    }
    setIsLoading(true);
    try {
      const res = await houseApi.listHouses();
      setHouses(res.houses);
      if (res.houses.length > 0) {
        // Keep active or pick first
        setActiveHouse((prev) => {
          if (prev && res.houses.some((h) => h.id === prev.id)) return prev;
          const savedHouseId = localStorage.getItem('homie_active_house_id');
          const matched = res.houses.find((h) => h.id === savedHouseId);
          return matched || res.houses[0] || null;
        });
      } else {
        // Automatically create a default house if none exists
        const defaultHouse = await houseApi.createHouse({ name: 'บ้านของฉัน' });
        setHouses([defaultHouse.house]);
        setActiveHouse(defaultHouse.house);
        localStorage.setItem('homie_active_house_id', defaultHouse.house.id);
      }
    } catch (_err) {
      // Ignored
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refreshHouses();
  }, [refreshHouses]);

  const selectHouse = (house: House) => {
    setActiveHouse(house);
    localStorage.setItem('homie_active_house_id', house.id);
  };

  const createHouse = async (name: string): Promise<House> => {
    const res = await houseApi.createHouse({ name });
    await refreshHouses();
    selectHouse(res.house);
    return res.house;
  };

  return (
    <HouseContext.Provider
      value={{ houses, activeHouse, isLoading, selectHouse, createHouse, refreshHouses }}
    >
      {children}
    </HouseContext.Provider>
  );
};

export function useHouse() {
  const context = useContext(HouseContext);
  if (!context) {
    throw new Error('useHouse must be used within a HouseProvider');
  }
  return context;
}
