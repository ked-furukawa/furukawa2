// src/components/StoreProductPanel.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
Box,
Typography,
Paper,
Skeleton,
Table,
TableBody,
TableCell,
TableContainer,
TableHead,
TableRow,
Checkbox,
// Divider
} from '@mui/material';

// 商品の型定義
interface Product {
id: string;
itemId: string;
itemName: string;
itemFormalName: string;
orderCount: number;
quantity: number;
isChecked: boolean;
}

// コンポーネントのProps型定義
interface StoreProductPanelProps {
storeNumber: string;
storeName: string;
products: Product[];
selectedProductIds?: string[];
onProductSelect: (productId: string) => void;
loading?: boolean;
error?: string | null;
completedStoreIds?: string[];
}

/**
 * 店舗情報と商品リストを統合したパネルコンポーネント
 */
export const StoreProductPanel: React.FC<StoreProductPanelProps> = ({
    storeNumber,
    storeName,
    products,
    selectedProductIds = [],
    onProductSelect,
    loading = false,
    error = null,
    completedStoreIds,
    }) => {
    // テーブルコンテナへの参照を作成
    const tableContainerRef = useRef<HTMLDivElement>(null);
    // タッチされた商品IDを記録するための状態
    const [touchedProductIds, setTouchedProductIds] = useState<string[]>([]);

    // storeNumberが変更されたときにスクロール位置をリセットする
    useEffect(() => {
        if (tableContainerRef.current) {
            tableContainerRef.current.scrollTop = 0;
        }
        // タッチ状態もリセット
        setTouchedProductIds([]);
    }, [storeNumber]); // storeNumberが変わったときだけ実行

    // 商品行タッチ時のハンドラー
    const handleRowTouch = (productId: string) => {
        // 既存のコード
        if (touchedProductIds.includes(productId)) {
            return;
        }
        
        setTouchedProductIds(prev => [...prev, productId]);
    };
    
    // 商品選択時に自動スクロールを行う関数
    const handleProductSelect = (productId: string) => {
        // 既存のコード
        onProductSelect(productId);
    };



        
    return (
        <Paper
        elevation={3}
        sx={{
            borderRadius: 2,
            overflow: 'hidden',
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
        }}
        >
        {/* ヘッダー部分を直接追加 */}
        <Box
            sx={{
            p: 1.5,
            backgroundColor: '#1976d2', // MUIのprimary色
            color: 'white',
            borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
            }}
        >
            <Typography variant="h6" fontWeight="medium">
            商品管理
            </Typography>
        </Box>

        {/* 店舗情報ヘッダー部分 */}
        <Box
            sx={{
            p: 1,
            backgroundColor: '#f5f5f5',
            borderBottom: '1px solid rgba(224, 224, 224, 1)'
            }}
        >
            {loading ? (
            // ローディング中の表示
            <Box>
                <Skeleton variant="text" width="30%" height={40} />
                <Skeleton variant="text" width="60%" height={30} />
            </Box>
            ) : (
            // 店舗情報の表示
            <Box>
            <Box display="flex" alignItems="center" mb={0}>
                {/* 店舗番号を太字で表示 */}
                <Typography
                variant="h4"  // サイズを大きくして目立たせる
                component="span"
                sx={{
                    px: 1,
                    py: 0.25,
                    borderRadius: 1,
                    fontWeight: 'bold',  // 太字に変更
                    mr: 2
                }}
                >
                {storeNumber || '不明'}
                </Typography>
                
                {/* 店舗名を小さく表示 */}
                <Typography
                variant="subtitle1"  // サイズを小さく変更
                component="h1"
                fontWeight="medium"  // やや軽めの太さに
                >
                {storeName || '店舗名なし'}
                </Typography>
            </Box>
            </Box>
            )}
        </Box>

    {/* エラー表示 */}
    {error && (
        <Box sx={{ p: 2, color: 'error.main' }}>
        <Typography>{error}</Typography>
        </Box>
    )}

    {/* 商品リスト部分 */}
    <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {loading ? (
        <Box sx={{ p: 2 }}>
            <Typography>読み込み中...</Typography>
        </Box>
        ) : products.length === 0 ? (
        <Box sx={{ p: 2 }}>
            <Typography>商品がありません</Typography>
        </Box>
        ) : (
        <TableContainer 
                ref={tableContainerRef} // ここにrefを追加
                sx={{ flex: 1, overflowY: 'auto' }}
            >
            <Table stickyHeader size="medium" sx={{ tableLayout: 'fixed' }}>
            <TableHead>
            <TableRow>
                <TableCell sx={{ fontSize: '1.1rem', fontWeight: 'bold', padding: '16px 12px' }}>商品名</TableCell>
                <TableCell align="right" sx={{ fontSize: '1.1rem', fontWeight: 'bold' }}>個数</TableCell>
                <TableCell align="center" sx={{ fontSize: '1.1rem', fontWeight: 'bold' }}>選択</TableCell>
            </TableRow>
            </TableHead>
            <TableBody>
                {products.map((product) => (
                <TableRow
                    key={product.id}
                    hover={!touchedProductIds.includes(product.id)} // タッチ済みの場合はホバー効果を無効化
                    selected={completedStoreIds?.includes(storeNumber) || selectedProductIds.includes(product.id)}
                    onClick={() => handleRowTouch(product.id)} // 行タッチ時のハンドラーを追加
                    sx={{
                        cursor: touchedProductIds.includes(product.id) ? 'default' : 'pointer', // タッチ済みの場合はカーソルスタイルを変更
                        backgroundColor: touchedProductIds.includes(product.id) ? 'rgba(144, 202, 249, 0.3)' : 'inherit', // タッチ済みの場合は背景色を変更
                        '&:hover': {
                        backgroundColor: touchedProductIds.includes(product.id) ? 'rgba(144, 202, 249, 0.3)' : undefined, // タッチ済みの場合はホバー時の背景色も固定
                        }
                    }}
                    >
                    <TableCell sx={{ 
                    maxWidth: 0, // これが重要: テキストの省略を強制
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontSize: '1rem', // フォントサイズを大きく
                    padding: '16px 12px' // パディングを増やす
                }}>
                    <Typography 
                    variant="body1" // body2からbody1に変更してサイズアップ
                    sx={{ 
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontWeight: 500, // やや太めに
                        lineHeight: 1.4 // 行の高さを調整
                    }}
                    >
                    {product.itemName}
                    </Typography>
                    <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ 
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontSize: '0.85rem' // キャプションも大きく
                    }}
                    >
                    {product.itemFormalName}
                    </Typography>
                </TableCell>
                    <TableCell 
                        align="right"
                        sx={{ 
                            fontSize: '1.5rem', // 個数表示を大きく
                            fontWeight: 500, // やや太めに
                            padding: '16px 8px', // パディングを増やす
                            textAlign: 'right', // 右寄せのまま
                            paddingRight: '24px' // 右側の余白を増やして全体的に左に寄せる
                        }}
                        >
                        {product.orderCount}
                        </TableCell>
                    <TableCell 
                    align="center" 
                    onClick={(e) => e.stopPropagation()}
                    sx={{ padding: '8px' }} // パディングを調整
                    > 
                    <Checkbox
                        checked={completedStoreIds?.includes(storeNumber)||selectedProductIds.includes(product.id)}
                        onChange={() => handleProductSelect(product.id)}
                        sx={{ 
                        '& .MuiSvgIcon-root': { 
                            fontSize: 35 // チェックボックスのサイズを大きく
                        },
                        padding: '8px' // チェックボックス自体のパディングも調整
                        }}
                    />
                    </TableCell>
                    </TableRow>
                ))}
            </TableBody>
            </Table>
        </TableContainer>
        )}

        {/* フッター部分 - 合計情報 */}
        <Box sx={{ p: 2, borderTop: '1px solid rgba(224, 224, 224, 1)', backgroundColor: '#fafafa' }}>
        <Typography variant="body1">
            合計商品数: {products.length} / 合計個数: {products.reduce((sum, product) => sum + product.orderCount, 0)}
        </Typography>
        {/* <Typography variant="body2" color="text.secondary">
            選択中: {selectedProductIds.length} 商品
        </Typography> */}
        </Box>
    </Box>
    </Paper>
);
};

export default StoreProductPanel;