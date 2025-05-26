// src/components/StoreList.tsx
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemText, 
  Typography, 
  Divider,
  Collapse,
  IconButton
} from '@mui/material';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { fetchStoresByDestination } from '../services/dataService';
import { StoresByDestination } from '../types';

interface StoreListProps {
  selectedStoreId: string | null;
  onSelectStore: (storeId: string) => void;
  completedStoreIds: string[];
}

const StoreList: React.FC<StoreListProps> = ({ 
  selectedStoreId, 
  onSelectStore,
  completedStoreIds 
}) => {
  const [storesByDestination, setStoresByDestination] = useState<StoresByDestination[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedDestinations, setExpandedDestinations] = useState<Record<string, boolean>>({});

  // 送り先ごとの店舗データを取得
  useEffect(() => {
    const loadStores = async () => {
      try {
        setLoading(true);
        const data = await fetchStoresByDestination();
        setStoresByDestination(data);
        
        // 初期状態ですべての送り先を展開
        const initialExpandState: Record<string, boolean> = {};
        data.forEach(item => {
          initialExpandState[item.destination.id] = true;
        });
        setExpandedDestinations(initialExpandState);
      } catch (err) {
        setError('店舗データの読み込みに失敗しました');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadStores();
  }, []);

  // 送り先の展開/折りたたみを切り替え
  const toggleDestination = (destinationId: string) => {
    setExpandedDestinations(prev => ({
      ...prev,
      [destinationId]: !prev[destinationId]
    }));
  };

  if (loading) {
    return (
      <Box sx={{ width: 250, p: 2 }}>
        <Typography>読み込み中...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ width: 250, p: 2 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        width: 250, 
        height: '100%',
        borderRight: 1,
        borderColor: 'divider',
        overflow: 'auto'
      }}
    >
      <Typography variant="h6" sx={{ p: 2, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
        店舗一覧
      </Typography>
      <List component="nav" dense>
        {storesByDestination.map((group) => (
          <React.Fragment key={group.destination.id}>
            {/* 送り先ヘッダー */}
            <ListItem 
              sx={{ 
                bgcolor: 'grey.100',
                borderBottom: 1,
                borderColor: 'divider'
              }}
            >
              <ListItemText 
                primary={group.destination.name} 
                primaryTypographyProps={{ fontWeight: 'bold' }}
              />
              <IconButton 
                edge="end" 
                size="small"
                onClick={() => toggleDestination(group.destination.id)}
              >
                {expandedDestinations[group.destination.id] ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </ListItem>
            
            {/* 送り先に属する店舗リスト */}
            <Collapse in={expandedDestinations[group.destination.id]} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {group.stores.map((store) => (
                  <ListItemButton
                    key={store.id}
                    selected={selectedStoreId === store.id}
                    onClick={() => onSelectStore(store.id)}
                    sx={{ pl: 4 }}
                  >
                    <ListItemText 
                      primary={store.storeName} 
                      secondary={`店舗番号: ${store.storeNumber}`}
                    />
                  </ListItemButton>
                ))}
              </List>
            </Collapse>
            
            <Divider />
          </React.Fragment>
        ))}
      </List>
    </Box>
  );
};

export default StoreList;