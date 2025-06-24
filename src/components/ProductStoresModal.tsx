import React from 'react';
import {
Dialog,
DialogTitle,
DialogContent,
IconButton,
Typography,
List,
ListItem,
ListItemText,
Divider,
Box,
useMediaQuery,
useTheme
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

// 商品データの型定義（Orderモデルベース）
interface Product {
date: string;
itemId: string; //itemId
itemName: string; // itemName
itemFormalName: string;
itemCounts: number; // itemCountの合計値
isChecked: boolean; // ローカル状態で管理
departmentId: string; //担当部門ID
}

//表示用の型定義
type StoreSummary = {
storeId: string;
storeName: string;
itemCount: number;
};

// 物流センターごとにグループ化した店舗データの型定義
type GroupedStoreSummary = {
[tcName: string]: StoreSummary[];
};

// 注文データの型定義（any型を使用して柔軟に対応）
interface ProductStoresModalProps {
open: boolean;
onClose: () => void;
product: Product | null;
allOrders: any[]; // 柔軟に対応するためにany[]型を使用
}

const ProductStoresModal: React.FC<ProductStoresModalProps> = ({
open,
onClose,
product,
allOrders
}) => {
const theme = useTheme();
const isPortrait = useMediaQuery('(orientation: portrait)');

// 選択された商品に関連する店舗データをフィルタリング
const filtered = allOrders.filter(order => order.itemId === product?.itemId);

// 物流センターごとに店舗をグループ化
const groupedStores = filtered.reduce<GroupedStoreSummary>((acc, order) => {
    const { storeId, storeName, storeTc, itemCount } = order;
    const tcName = storeTc || '未分類'; // storeTcがない場合の対応
    
    if (!acc[tcName]) {
    acc[tcName] = [];
    }
    
    // 既存の店舗データを探す
    const existingStore = acc[tcName].find(store => store.storeId === storeId);
    
    if (existingStore) {
    existingStore.itemCount += itemCount;
    } else {
    acc[tcName].push({
        storeId,
        storeName: storeName || `店舗ID: ${storeId}`,
        itemCount
    });
    }
    
    return acc;
}, {});

// 各物流センター内で店舗を店舗番号の昇順にソート
Object.keys(groupedStores).forEach(tcName => {
  groupedStores[tcName].sort((a, b) => {
    // 数値として比較（先頭の0を無視）
    const numA = parseInt(a.storeId, 10);
    const numB = parseInt(b.storeId, 10);
    
    // 数値変換できない場合は文字列として比較
    if (isNaN(numA) || isNaN(numB)) {
      return a.storeId.localeCompare(b.storeId);
    }
    
    return numA - numB;
  });
});

// 物流センターごとの合計注文数を計算
const tcTotals = Object.entries(groupedStores).reduce<{[tcName: string]: number}>((acc, [tcName, stores]) => {
    acc[tcName] = stores.reduce((sum, store) => sum + store.itemCount, 0);
    return acc;
}, {});

// 全体の合計店舗数と注文数
const totalStores = Object.values(groupedStores).reduce((sum, stores) => sum + stores.length, 0);
const totalItems = Object.values(tcTotals).reduce((sum, count) => sum + count, 0);

// 物流センターの表示順を定義（上越を先に表示）
const tcDisplayOrder = ["中之島", "上越", "未分類"];

// 物流センターをソートする関数
const sortTcEntries = (entries: [string, StoreSummary[]][]): [string, StoreSummary[]][] => {
    return entries.sort((a, b) => {
    const indexA = tcDisplayOrder.indexOf(a[0]);
    const indexB = tcDisplayOrder.indexOf(b[0]);
    
    // 定義されていない物流センターは最後に表示
    if (indexA === -1 && indexB === -1) return a[0].localeCompare(b[0]);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    
    return indexA - indexB;
    });
};

// ソートされた物流センターのエントリー
const sortedTcEntries = sortTcEntries(Object.entries(groupedStores));

return (
    <Dialog
    open={open}
    onClose={onClose}
    maxWidth="sm"
    fullWidth
    PaperProps={{
        sx: {
        borderRadius: 2,
        maxHeight: '80vh'
        }
    }}
    >
    <DialogTitle sx={{ 
        bgcolor: theme.palette.primary.main, 
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        py: 2,
        px: 3
    }}>
        <Typography variant="h6" component="div" sx={{ 
        fontWeight: 'bold',
        fontSize: isPortrait ? '1.5rem' : '1.3rem'
        }}>
        {/* 社内呼称がない場合は正式名称を表示、どちらもない場合は商品IDを表示 */}
        {product?.itemName || product?.itemFormalName || `商品ID: ${product?.itemId}` || '不明な商品'} - 注文店舗一覧
        </Typography>
        <IconButton
        edge="end"
        color="inherit"
        onClick={onClose}
        aria-label="close"
        >
        <CloseIcon />
        </IconButton>
    </DialogTitle>
    
    <DialogContent dividers sx={{ p: 0 }}>
        {sortedTcEntries.length > 0 ? (
        <List sx={{ width: '100%', bgcolor: 'background.paper', p: 0 }}>
            {/* 列ヘッダー */}
            <ListItem sx={{ 
            bgcolor: '#f5f5f5', 
            py: 1.5,
            borderBottom: '1px solid #e0e0e0'
            }}>
            <ListItemText 
                primary={
                <Typography 
                    variant="subtitle1" 
                    sx={{ 
                    fontWeight: 'bold',
                    fontSize: isPortrait ? '1.3rem' : '1.1rem'
                    }}
                >
                    店舗情報
                </Typography>
                } 
                sx={{ flex: 2 }}
            />
            <ListItemText 
                primary={
                <Typography 
                    variant="subtitle1" 
                    align="right"
                    sx={{ 
                    fontWeight: 'bold',
                    fontSize: isPortrait ? '1.3rem' : '1.1rem'
                    }}
                >
                    注文数
                </Typography>
                } 
                sx={{ flex: 1 }}
            />
            </ListItem>
            
            {/* 物流センターごとのループ（ソート済み） */}
            {sortedTcEntries.map(([tcName, stores]) => (
            <React.Fragment key={tcName}>
                {/* 物流センター見出し */}
                <ListItem 
                sx={{ 
                    bgcolor: theme.palette.primary.light,
                    color: theme.palette.primary.contrastText,
                    py: 1.5
                }}
                >
                <ListItemText 
                    primary={
                    <Typography 
                        variant="h6" 
                        sx={{ 
                        fontWeight: 'bold',
                        fontSize: isPortrait ? '1.4rem' : '1.2rem'
                        }}
                    >
                        {tcName}
                    </Typography>
                    }
                />
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    {stores.length}店舗
                </Typography>
                </ListItem>
                
            {/* 店舗リスト */}
            {stores.map((store, index) => (
            <React.Fragment key={store.storeId}>
                <ListItem sx={{ 
                py: isPortrait ? 1.8 : 1.3,
                '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' }
                }}>
                <Box sx={{ flex: 2, display: 'flex', alignItems: 'center' }}>
                    {/* 店舗番号を大きく表示 */}
                    <Typography 
                    variant="body1"
                    sx={{ 
                        fontSize: isPortrait ? '1.5rem' : '1.3rem',
                        fontWeight: 'bold',
                        marginRight: 1
                    }}
                    >
                    {store.storeId}
                    </Typography>
                    {/* 店舗名を右側に小さく表示 */}
                    <Typography 
                    variant="body2"
                    sx={{ 
                        fontSize: isPortrait ? '1rem' : '0.9rem',
                        color: 'text.secondary'
                    }}
                    >
                    {store.storeName}
                    </Typography>
                </Box>
                <ListItemText 
                    primary={
                    <Typography 
                        variant="body1" 
                        align="right"
                        sx={{ 
                        fontSize: isPortrait ? '1.2rem' : '1rem',
                        fontWeight: 'bold'
                        }}
                    >
                        {store.itemCount}個
                    </Typography>
                    } 
                    sx={{ flex: 1 }}
                />
                </ListItem>
                {index < stores.length - 1 && <Divider />}
            </React.Fragment>
            ))}
                
                {/* 物流センターごとの小計 */}
                <ListItem sx={{ bgcolor: '#f0f0f0', py: 1 }}>
                <ListItemText 
                    primary={
                    <Typography variant="subtitle2" align="right" sx={{ fontWeight: 'medium' }}>
                        小計: {tcTotals[tcName]}個
                    </Typography>
                    }
                />
                </ListItem>
                <Divider sx={{ borderWidth: 2 }} />
            </React.Fragment>
            ))}
        </List>
        ) : (
        <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
            注文店舗情報がありません
            </Typography>
        </Box>
        )}
    </DialogContent>
    
    <Box sx={{ 
        p: 2, 
        bgcolor: '#f5f5f5', 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center'
    }}>
        <Box>
        <Typography variant="subtitle1" sx={{ 
            fontWeight: 'bold',
            fontSize: isPortrait ? '1.1rem' : '0.9rem'
        }}>
            合計: {totalStores}店舗
        </Typography>
        <Typography variant="caption" sx={{ display: 'block' }}>
            {sortedTcEntries.map(([tcName, stores]) => (
            `${tcName}: ${stores.length}店舗`
            )).join(' / ')}
        </Typography>
        </Box>
        <Typography variant="subtitle1" sx={{ 
        fontWeight: 'bold',
        fontSize: isPortrait ? '1.2rem' : '1rem'
        }}>
        総注文数: {totalItems}個
        </Typography>
    </Box>
    </Dialog>
);
};

export default ProductStoresModal;