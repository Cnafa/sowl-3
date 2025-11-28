
// context/BoardContext.tsx
import React, { createContext, useState, useContext, ReactNode, useMemo, useCallback, useEffect } from 'react';
import { Board, BoardMember, Role, Permission } from '../types';
import { ALL_USERS, ROLES } from '../constants';
import { useAuth } from './AuthContext';
import * as api from '../services/api';

interface BoardContextType {
  boards: Board[];
  activeBoard: Board | null;
  setActiveBoard: (boardId: string) => void;
  createBoard: (boardName: string, iconUrl?: string) => Board;
  joinBoard: (code: string) => Promise<void>;
  can: (permission: Permission) => boolean;
  activeBoardMembers: BoardMember[];
  roles: Role[];
}

const BoardContext = createContext<BoardContextType | undefined>(undefined);

export const BoardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [boards, setBoards] = useState<Board[]>([]);
  const [boardMembers, setBoardMembers] = useState<Record<string, BoardMember[]>>({});
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
        api.fetchBoardsForUser(user.id).then(data => {
            setBoards(data.boards);
            setBoardMembers(data.boardMembers);

            const lastActiveId = localStorage.getItem('so.activeBoardId');
            if (lastActiveId && data.boards.some(b => b.id === lastActiveId)) {
                setActiveBoardId(lastActiveId);
            } else if (data.boards.length > 0) {
                setActiveBoardId(data.boards[0].id);
            }
        });
    } else {
        setBoards([]);
        setBoardMembers({});
        setActiveBoardId(null);
        localStorage.removeItem('so.activeBoardId');
    }
  }, [user]);

  const activeBoard = useMemo(() => boards.find(b => b.id === activeBoardId) || null, [boards, activeBoardId]);
  
  const activeBoardMembers = useMemo(() => {
    if (!activeBoardId) return [];
    return boardMembers[activeBoardId] || [];
  }, [activeBoardId, boardMembers]);

  const can = useCallback((permission: Permission): boolean => {
    if (!activeBoardId || !user) return false;

    const memberInfo = boardMembers[activeBoardId]?.find(m => m.user.id === user.id);
    if (!memberInfo) return false;

    const role = ROLES.find(r => r.id === memberInfo.roleId);
    if (!role) return false;

    return role.permissions.includes(permission);
  }, [activeBoardId, user, boardMembers]);

  const setActiveBoard = (boardId: string) => {
    setActiveBoardId(boardId);
    localStorage.setItem('so.activeBoardId', boardId);
  };

  const createBoard = useCallback((boardName: string, iconUrl?: string): Board => {
    if (!user) {
      throw new Error("User must be logged in to create a board");
    }
    const newBoard: Board = {
      id: `board-${Date.now()}`,
      name: boardName,
      iconUrl,
    };
    const ownerRole = ROLES.find(r => r.name === 'Owner');
    if (!ownerRole) {
        throw new Error("Owner role not found");
    }
    
    setBoards(prev => [...prev, newBoard]);
    setBoardMembers(prev => ({
      ...prev,
      [newBoard.id]: [{ user, roleId: ownerRole.id }]
    }));
    // In a real app, this would be an API call:
    // api.createBoard(newBoard).then(...)
    
    return newBoard;
  }, [user]);

  const joinBoard = useCallback(async (code: string) => {
      if (!user) throw new Error("User must be logged in to join a board");
      const board = await api.joinBoard(code, user);
      
      // Update local state if board is new to the list
      setBoards(prev => {
          if (prev.some(b => b.id === board.id)) return prev;
          return [...prev, board];
      });
      
      // Refresh members for permissions update
      const { boardMembers: updatedMembers } = await api.fetchBoardsForUser(user.id);
      setBoardMembers(updatedMembers);

      // Switch to the newly joined board
      setActiveBoardId(board.id);
      localStorage.setItem('so.activeBoardId', board.id);
  }, [user]);
  
  const value = useMemo(() => ({
    boards,
    activeBoard,
    setActiveBoard,
    createBoard,
    joinBoard,
    can,
    activeBoardMembers,
    roles: ROLES,
  }), [boards, activeBoard, can, activeBoardMembers, createBoard, joinBoard, setActiveBoard]);

  return (
    <BoardContext.Provider value={value}>
      {children}
    </BoardContext.Provider>
  );
};

export const useBoard = (): BoardContextType => {
  const context = useContext(BoardContext);
  if (!context) {
    throw new Error('useBoard must be used within a BoardProvider');
  }
  return context;
};
