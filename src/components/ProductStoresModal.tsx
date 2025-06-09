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
    date:string;

    itemId: string; //itemId
    itemName: string; // itemName
    itemCounts: number; // itemCountの合計値
    isChecked: boolean; // ローカル状態で管理

    departmentId:string; //担当部門ID
}
//表示用の型定義
type StoreSummary = {
    storeId: string;
    storeName: string;
    itemCount: number;
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

// 店舗ごとに注文数をグループ化
const summaryMap = filtered.reduce<{ [storeId: string]: StoreSummary }>((acc, order) => {
    const { storeId, storeName, itemCount } = order;

    if (!acc[storeId]) {
        acc[storeId] = {
            storeId,
            storeName: storeName || `店舗ID: ${storeId}`,
            itemCount: 0,
        };
    }

        acc[storeId].itemCount += itemCount;
        return acc;
    }, {});

// 店舗グループを配列に変換
const storeList = Object.values(summaryMap);

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
        {product?.itemName} - 注文店舗一覧
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
        {storeList.length > 0 ? (
        <List sx={{ width: '100%', bgcolor: 'background.paper', p: 0 }}>
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
                    店舗名
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
            
            {storeList.map((store, index) => (
            <React.Fragment key={store.storeId}>
                <ListItem sx={{ 
                py: isPortrait ? 2 : 1.5,
                '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' }
                }}>
                <ListItemText 
                    primary={
                    <Typography 
                        variant="body1"
                        sx={{ 
                        fontSize: isPortrait ? '1.2rem' : '1rem',
                        fontWeight: 500
                        }}
                    >
                        {store.storeName}
                    </Typography>
                    } 
                    sx={{ flex: 2 }}
                />
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
                {index < storeList.length - 1 && <Divider />}
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
        <Typography variant="subtitle1" sx={{ 
        fontWeight: 'bold',
        fontSize: isPortrait ? '1.2rem' : '1rem'
        }}>
        合計: {storeList.length}店舗
        </Typography>
        <Typography variant="subtitle1" sx={{ 
        fontWeight: 'bold',
        fontSize: isPortrait ? '1.2rem' : '1rem'
        }}>
        総注文数: {storeList.reduce((sum, store) => sum + store.itemCount, 0)}個
        </Typography>
    </Box>
    </Dialog>
);
};

export default ProductStoresModal;