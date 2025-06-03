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

import { filterByCompleteFlag } from './filterByCompleteFlag';

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

// BoxColor 型の定義
type BoxColor = 'green' | 'red' | 'blue' | 'yellow';

// BoxData 型の定義を追加
interface BoxData {
  storeId: string;
  boxCount: number;
  color: BoxColor;
}

// props の型定義を更新
interface StoreListProps {
  selectedStoreId: string | null;
  onSelectStore: (storeId: string) => void;
  completedStores?: {storeId: string, boxCount: number, color: BoxColor}[]; // オプショナルに変更
}


const StoreList: React.FC<StoreListProps> = ({ 
  selectedStoreId, 
  onSelectStore,
  completedStores = [] // デフォルト値を空配列に設定
}) => {
  const [storesByDestination, setStoresByDestination] = useState<StoresByDestination[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedDestinations, setExpandedDestinations] = useState<Record<string, boolean>>({});
  const [boxData, setBoxData] = useState<BoxData[]>([]); // 箱数データの状態を追加

  // StoreList.tsx の fetchBoxData 関数を修正
    const fetchBoxData = async () => {
      try {
        // テスト用固定日付
        const testDate = "2025-06-02";
        
        // Box テーブルからデータを取得（日付フィルタを追加）
        const { data: boxItems } = await dataClient.models.Box.list({
          filter: { date: { eq: testDate } }
        });

        const filteredBoxItems = await filterByCompleteFlag(testDate,'test',boxItems);
        
        // 取得したデータを適切な形式に変換
        const formattedBoxData = filteredBoxItems.map(box => ({
          storeId: box.storeId,
          boxCount: box.boxCount || 0,
          color: (box.color as BoxColor) || 'green'
        }));
        
        setBoxData(formattedBoxData);
      } catch (err) {
        console.error('箱数データの取得に失敗しました:', err);
      }
    };

  // コンポーネントマウント時に箱数データを取得
  useEffect(() => {
    fetchBoxData();
    
    // // リアルタイム更新のためのサブスクリプション設定
    //   const testDate = "2025-06-02";
    //   const subscription = dataClient.models.Box.observeQuery({
    //     filter: { date: { eq: testDate } }
    //   }).subscribe({
    //     next: ({ items }) => {
    //       const formattedBoxData = items.map(box => ({
    //         storeId: box.storeId,
    //         boxCount: box.boxCount || 0,
    //         color: (box.color as BoxColor) || 'green'
    //       }));
          
    //       setBoxData(formattedBoxData);
    //     },
    //     error: (err) => console.error('箱数データの監視に失敗しました:', err)
    //   });
    
    // // クリーンアップ関数
    // return () => subscription.unsubscribe();
  }, []);

  // 送り先ごとの店舗データを取得
  useEffect(() => {
    const fetchStoresByDestination = async () => {
      try {
        setLoading(true);
        
        const testDate = "2025-06-02"; // テスト用固定日付
        
        // Order テーブルから店舗データを取得
        const { data: orderData } = await dataClient.models.Order.list({
          filter: { date: { eq: testDate } }
        });

          //フィルター関数に渡す
        const filteredOrderData = await filterByCompleteFlag(testDate,'test',orderData);

        // 店舗情報を抽出して重複を排除
        const storeMap = new Map<string, {
          id: string;
          storeNumber: string;
          storeName: string;
          storeTc: string;
        }>();
        
        filteredOrderData.forEach(order => {
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
          
          // 箱数データまたはcompletedStoresから完了状態を判定
          const isCompleted = 
            boxData.some(item => item.storeId === store.id) || 
            completedStores.some(item => item.storeId === store.id);
          
          destinationMap.get(tcId)?.stores.push({
            id: store.id,
            storeNumber: store.storeNumber,
            storeName: store.storeName,
            isCompleted
          });
        });
        
        // 結果を配列に変換
        const result: StoresByDestination[] = Array.from(destinationMap.values()).map(dest => ({
          destination: {
            id: dest.id,
            name: dest.name
          },
          stores: dest.stores
        }));
        
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
  }, [boxData, completedStores]); // boxDataとcompletedStoresが変更されたときに再取得

  // 送り先の展開/折りたたみを切り替え
  const toggleDestination = (destinationId: string) => {
    setExpandedDestinations(prev => ({
      ...prev,
      [destinationId]: !prev[destinationId]
    }));
  };

  const getStoreBoxInfo = (storeId: string): BoxData | undefined => {
      // まずpropsから渡されたcompletedStoresから検索（最新の情報）
      const completedStoreInfo = completedStores.find(item => item.storeId === storeId);
      if (completedStoreInfo) return completedStoreInfo;
      
      // なければ自前で取得した箱数データから検索
      return boxData.find(item => item.storeId === storeId);
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
            backgroundColor: '#1976d2',
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
            backgroundColor: '#1976d2',
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
        height: { xs: 'auto', md: '600px' },
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
          backgroundColor: '#1976d2',
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
                  {group.stores.map((store) => {
                    // 店舗の箱数情報を取得
                    const boxInfo = getStoreBoxInfo(store.id);
                    const hasBoxInfo = !!boxInfo;
                    
                    return (
                      <ListItemButton
                        key={store.id}
                        selected={selectedStoreId === store.id}
                        onClick={() => onSelectStore(store.id)}
                        sx={{ 
                          pl: 4,
                          bgcolor: hasBoxInfo ? 'rgba(76, 175, 80, 0.15)' : 'inherit',
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
                            fontSize: '1.4rem',
                            fontWeight: 'bold'
                          }}
                          secondary={`${store.storeName}`} 
                          secondaryTypographyProps={{ 
                            fontSize: '0.8rem'
                          }}
                        />
                        {hasBoxInfo && (
                          <Box 
                            sx={{ 
                              bgcolor: 'grey.300', // 箱数表示の背景色をグレーに固定
                              color: 'text.primary', // テキスト色を標準に
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
                            >
                              {boxInfo!.boxCount}
                            </Typography>
                          </Box>
                        )}
                      </ListItemButton>
                    );
                  })}
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