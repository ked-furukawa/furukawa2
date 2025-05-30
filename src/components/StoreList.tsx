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
  IconButton,
  CircularProgress,
  Paper
} from '@mui/material';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";

// Amplify クライアントの生成
const dataClient = generateClient<Schema>();

// 型定義
interface Store {
  id: string;
  storeNumber: string;
  storeName: string;
  isCompleted?: boolean;
}

interface Destination {
  id: string;
  name: string;
}

interface StoresByDestination {
  destination: Destination;
  stores: Store[];
}

// BoxColor 型の定義を追加
type BoxColor = 'green' | 'red' | 'blue' | 'yellow';

// props の型定義を更新
interface StoreListProps {
  selectedStoreId: string | null;
  onSelectStore: (storeId: string) => void;
  completedStores: {storeId: string, boxCount: number, color: BoxColor}[];
}

// getColorByBoxColor 関数を確認・修正
const getColorByBoxColor = (color: BoxColor): string => {
  switch (color) {
    case 'green': return 'success.main';
    case 'red': return 'error.main';
    case 'blue': return 'primary.main';
    case 'yellow': return 'warning.main';
    default: return 'success.main'; // デフォルトは緑
  }
};

// 送り先（TC）の優先順位を定義
const TC_PRIORITY: Record<string, number> = {
  "中之島": 1,   // 中之島を最初に表示
  "上越": 2,     // 上越を2番目に表示
  // 他のTCがあれば追加可能
};

// 送り先（TC）のソート関数
const sortDestinations = (a: StoresByDestination, b: StoresByDestination): number => {
  const priorityA = TC_PRIORITY[a.destination.name] || 999; // 優先順位が未定義の場合は大きな数値
  const priorityB = TC_PRIORITY[b.destination.name] || 999;
  
  // 優先順位で比較
  if (priorityA !== priorityB) {
    return priorityA - priorityB;
  }
  
  // 優先順位が同じ場合は名前でソート
  return a.destination.name.localeCompare(b.destination.name);
};

const StoreList: React.FC<StoreListProps> = ({ 
  selectedStoreId, 
  onSelectStore,
  completedStores
}) => {
  const [storesByDestination, setStoresByDestination] = useState<StoresByDestination[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedDestinations, setExpandedDestinations] = useState<Record<string, boolean>>({});

  // 送り先ごとの店舗データを取得
  useEffect(() => {
    const fetchStoresByDestination = async () => {
      try {
        setLoading(true);
        
        // 今日の日付を取得 (YYYY-MM-DD形式)
        // const today = new Date().toISOString().split('T')[0];
        const testDate = "2025-06-02"; // テスト用固定日付
        
        // Order テーブルから店舗データを取得
        const { data: orderData } = await dataClient.models.Order.list({
          filter: { date: { eq: testDate } }
        });

        // 店舗情報を抽出して重複を排除
        const storeMap = new Map<string, {
          id: string;
          storeNumber: string;
          storeName: string;
          storeTc: string;
        }>();
        
        orderData.forEach(order => {
          if (!storeMap.has(order.storeId)) {
            storeMap.set(order.storeId, {
              id: order.storeId,
              storeNumber: order.storeId,
              storeName: order.storeName || '不明な店舗',
              storeTc: order.storeTc || '未分類'
            });
          }
        });
        
        // 送り先（TC）ごとに店舗をグループ化
        const destinationMap = new Map<string, {
          id: string;
          name: string;
          stores: Store[];
        }>();
        
        storeMap.forEach(store => {
          const tcId = store.storeTc;
          if (!destinationMap.has(tcId)) {
            destinationMap.set(tcId, {
              id: tcId,
              name: tcId,
              stores: []
            });
          }
          
          destinationMap.get(tcId)?.stores.push({
            id: store.id,
            storeNumber: store.storeNumber,
            storeName: store.storeName,
            isCompleted: completedStores?.some(item => item.storeId === store.id) || false
          });
        });
        
        // 各送り先内の店舗を店舗番号でソート
        destinationMap.forEach(destination => {
          destination.stores.sort((a, b) => 
            a.storeNumber.localeCompare(b.storeNumber)
          );
        });
        
        // 結果を配列に変換
        const result: StoresByDestination[] = Array.from(destinationMap.values()).map(dest => ({
          destination: {
            id: dest.id,
            name: dest.name
          },
          stores: dest.stores
        }));
        
        // カスタム順序でソート（上越を中之島より前に表示）
        result.sort(sortDestinations);
        
        setStoresByDestination(result);
        
        // 初期状態ですべての送り先を展開
        const initialExpandState: Record<string, boolean> = {};
        result.forEach(item => {
          initialExpandState[item.destination.id] = true;
        });
        setExpandedDestinations(initialExpandState);
      } catch (err) {
        console.error('店舗データの取得に失敗しました:', err);
        setError('店舗データの読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchStoresByDestination();
  }, [completedStores]);

  // 送り先の展開/折りたたみを切り替え
  const toggleDestination = (destinationId: string) => {
    setExpandedDestinations(prev => ({
      ...prev,
      [destinationId]: !prev[destinationId]
    }));
  };

  // ローディング表示
  if (loading) {
    return (
      <Paper
        elevation={3}
        sx={{ 
          width: 250, 
          height: '100%',
          borderRadius: 2,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* ヘッダー部分 */}
        <Box
          sx={{
            p: 1.5,
            backgroundColor: '#1976d2', // MUIのprimary色
            color: 'white',
            borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          <Typography variant="h6" fontWeight="medium">
            店舗一覧
          </Typography>
        </Box>
        
        <Box sx={{ 
          flex: 1,
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center'
        }}>
          <CircularProgress />
        </Box>
      </Paper>
    );
  }

  // エラー表示
  if (error) {
    return (
      <Paper
        elevation={3}
        sx={{ 
          width: 250, 
          height: '100%',
          borderRadius: 2,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* ヘッダー部分 */}
        <Box
          sx={{
            p: 1.5,
            backgroundColor: '#1976d2', // MUIのprimary色
            color: 'white',
            borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          <Typography variant="h6" fontWeight="medium">
            店舗一覧
          </Typography>
        </Box>
        
        <Box sx={{ p: 2 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      </Paper>
    );
  }

  // 通常表示
  return (
    <Paper
      elevation={3}
      sx={{ 
        width: 250, 
        height: { xs: 'auto', md: '600px' }, // 他のパネルと同じ高さに設定
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* ヘッダー部分 */}
      <Box
        sx={{
          p: 1.5,
          backgroundColor: '#1976d2', // MUIのprimary色
          color: 'white',
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
        }}
      >
        <Typography variant="h6" fontWeight="medium">
          店舗一覧
        </Typography>
      </Box>
      
      {/* リスト部分 */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <List component="nav" dense disablePadding>
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
                      sx={{ 
                        pl: 4,
                        bgcolor: completedStores?.some(item => item.storeId === store.id) ? 'rgba(76, 175, 80, 0.15)' : 'inherit',
                        '&.Mui-selected': {
                          bgcolor: 'primary.light',
                          '&:hover': {
                            bgcolor: 'primary.light',
                          }
                        }
                      }}
                    >
                      <ListItemText 
                        primary={` ${store.storeNumber}`} 
                          primaryTypographyProps={{ 
                          fontSize: '1.4rem',  // 店舗番号のフォントサイズを指定
                          fontWeight: 'bold'   // 太字にする場合
                        }}
                        secondary={`${store.storeName}`} 
                        secondaryTypographyProps={{ 
                          fontSize: '0.8rem'   // 店舗名のフォントサイズを指定
                        }}
                      />
                      {completedStores?.some(item => item.storeId === store.id) && (
                        <Box 
                          sx={{ 
                            // 動的に色を設定
                            bgcolor: getColorByBoxColor(
                              completedStores.find(item => item.storeId === store.id)?.color || 'green'
                            ),
                            // 黄色の場合は黒テキスト、それ以外は白テキスト
                            color: completedStores.find(item => item.storeId === store.id)?.color === 'yellow' 
                              ? 'black' 
                              : 'white',
                            px: 1, 
                            py: 0.5, 
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: '40px'
                          }}
                        >
                          <Typography 
                            variant="body2" 
                            fontWeight="bold"
                            // 黄色の場合は黒テキスト、それ以外は白テキスト
                            sx={{ 
                              color: 'inherit'
                            }}
                          >
                            {completedStores.find(item => item.storeId === store.id)?.boxCount}
                          </Typography>
                        </Box>
                      )}
                    </ListItemButton>
                    
                  ))}
                </List>
              </Collapse>
              
              <Divider />
            </React.Fragment>
          ))}
        </List>
      </Box>
    </Paper>
  );
};

export default StoreList;