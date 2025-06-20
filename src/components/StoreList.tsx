// src/components/StoreList.tsx
import React, { useState, useEffect, useRef } from 'react';
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
import { formatDateToJST } from './utils/formatDateToJST';
import { useParams } from 'react-router-dom';

// import { groupOrdersByTcAndStore } from './utils/groupOrdersByTcAndStore';

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
type BoxColor = 'green' | 'red' | 'blue' | 'orange';

// BoxData 型の定義を追加
interface BoxData {
  storeId: string;
  boxCount: number;
  color: BoxColor;
}

// StoreList.tsx の props の型定義を修正
interface StoreListProps {
  selectedStoreId: string | null;
  onSelectStore: (storeId: string) => void;
  completedStores?: {storeId: string, boxCount: number, color: BoxColor}[];
  // 以下のプロパティを追加
  stores?: {
    id: string;
    storeNumber: string;
    storeName: string;
    storeTc?: string;
  }[];
}


const StoreList: React.FC<StoreListProps> = ({ 
  selectedStoreId, 
  onSelectStore,
  completedStores = [], // デフォルト値を空配列に設定
  stores = [] // stores プロパティを追加
}) => {
  const [storesByDestination, setStoresByDestination] = useState<StoresByDestination[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedDestinations, setExpandedDestinations] = useState<Record<string, boolean>>({});
  const [boxData, setBoxData] = useState<BoxData[]>([]); // 箱数データの状態を追加
  const departmentId = useParams().departmentId!;

  // 店舗要素への参照を保持するためのオブジェクト
  const storeRefs = useRef<Record<string, HTMLDivElement | null>>({});
  // リストコンテナへの参照
  const listContainerRef = useRef<HTMLDivElement | null>(null);

  const date = formatDateToJST(new Date);
  // StoreList.tsx の fetchBoxData 関数を修正
    const fetchBoxData = async () => {
      try {
        // テスト用固定日付
        // const testDate = "20250609";
        
        // Box テーブルからデータを取得（日付フィルタを追加）
        const { data: boxItems } = await dataClient.models.Box.listBoxesByDateAndDept({
            date: date,
            departmentId: {
              eq: departmentId
            }
          },
          {
              limit: 1000  // 最大1000件取得
          });

        const filteredBoxItems = boxItems
        
        // 取得したデータを適切な形式に変換
        const formattedBoxData = filteredBoxItems.map(box => ({
          storeId: box.storeId,
          boxCount: box.boxCount || 0,
          color: (box.boxColor as BoxColor) || 'green'
        }));
        
        setBoxData(formattedBoxData);
      } catch (err) {
        console.error('箱数データの取得に失敗しました:', err);
      }
    };

  // コンポーネントマウント時に箱数データを取得
  useEffect(() => {
    fetchBoxData();

    console.log('test');
    
    // リアルタイム更新のためのサブスクリプション設定
      // const testDate = "20250609";
      const subscription = dataClient.models.Box.observeQuery({
        filter: { date: { eq: date },departmentId: {eq:departmentId} }
      }).subscribe({
        next: ({ items }) => {
          const formattedBoxData = items.map(box => ({
            storeId: box.storeId,
            boxCount: box.boxCount || 0,
            color: (box.boxColor as BoxColor) || 'green'
          }));
          
          setBoxData(formattedBoxData);
        },
        error: (err) => console.error('箱数データの監視に失敗しました:', err)
      });
    
    // クリーンアップ関数
    return () => subscription.unsubscribe();
  }, []);

// 送り先ごとの店舗データを処理
useEffect(() => {
  try {
    setLoading(true);
    
    // 店舗情報を抽出して重複を排除
    const storeMap = new Map<string, {
      id: string;
      storeNumber: string;
      storeName: string;
      storeTc: string;
    }>();
    
    stores.forEach(store => {
      if (!storeMap.has(store.id)) {
        storeMap.set(store.id, {
          id: store.id,
          storeNumber: store.storeNumber,
          storeName: store.storeName,
          storeTc: store.storeTc || '未分類'
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
      // ここで各送り先の店舗を昇順にソート
      stores: dest.stores.sort((a, b) => Number(a.id) - Number(b.id))
    }));
    
    // 送り先の順序を調整（中之島を先頭に）
    result.sort((a, b) => {
      if (a.destination.id === '中之島') return -1;
      if (b.destination.id === '中之島') return 1;
      return 0;
    });
    
    setStoresByDestination(result);
    
    // 初期状態ですべての送り先を展開
    const initialExpandState: Record<string, boolean> = {};
    result.forEach(item => {
      initialExpandState[item.destination.id] = true;
    });
    setExpandedDestinations(initialExpandState);
  } catch (err) {
    console.error('店舗データの処理に失敗しました:', err);
    setError('店舗データの処理に失敗しました');
  } finally {
    setLoading(false);
  }
}, [boxData, completedStores, stores]); // stores を依存配列に追加

// 選択された店舗が変更されたときに自動スクロール
  useEffect(() => {
    if (selectedStoreId && !loading) {
      // 選択された店舗の要素を取得
      const selectedStoreElement = storeRefs.current[selectedStoreId];
      
      if (selectedStoreElement) {
        // 選択された店舗が属する送り先を見つける
        const destinationGroup = storesByDestination.find(group => 
          group.stores.some(store => store.id === selectedStoreId)
        );
        
        // 送り先が見つかり、折りたたまれている場合は展開
        if (destinationGroup && !expandedDestinations[destinationGroup.destination.id]) {
          setExpandedDestinations(prev => ({
            ...prev,
            [destinationGroup.destination.id]: true
          }));
          
          // 展開後にスクロールするために少し遅延
          setTimeout(() => {
            scrollToSelectedStore(selectedStoreId);
          }, 300);
        } else {
          // 送り先が既に展開されている場合は即座にスクロール
          scrollToSelectedStore(selectedStoreId);
        }
      }
    }
  }, [selectedStoreId, loading, storesByDestination, expandedDestinations]);
  
  // 選択された店舗にスクロールする関数
  const scrollToSelectedStore = (storeId: string) => {
    const selectedElement = storeRefs.current[storeId];
    const container = listContainerRef.current;
    
    if (selectedElement && container) {
      // スムーズにスクロール
      selectedElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center', // 画面真ん中に出るようにスクロール
      });
    }
  };
  
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
      
      {/* リスト部分 - ref を追加 */}
      <Box 
        ref={listContainerRef} 
        sx={{ flex: 1, overflow: 'auto' }}
      >
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
                        // ref を設定
                        ref={(el) => storeRefs.current[store.id] = el}
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