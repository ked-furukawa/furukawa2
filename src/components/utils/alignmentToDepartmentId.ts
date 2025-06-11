export function alignmentToDepartmentId(alignment: number): string | null {
    if (typeof alignment !== 'number' || isNaN(alignment)) return null;

    // 完全一致の特別処理
    if (alignment === 6084) return 'honsyabuturyu';//本社物流棒ヒレカツ

    const ranges = [
        { min: 1001, max: 1999, id: '2souzai' },//惣菜2
        { min: 2000, max: 3000, id: '1souzai' },//惣菜1
        { min: 3001, max: 3499, id: '3souzai' },//惣菜3
        { min: 3500, max: 3699, id: 'seika' },//青果部門、担当部門不明
        { min: 3700, max: 3800, id: 'namashitsu1' },//生室1回目水産部門
        { min: 3801, max: 5999, id: 'namashitsu2' },//生室2回目精肉部門
        { min: 6000, max: 6079, id: 'kakou1' },//加工1回目
        { min: 6080, max: 6083, id: 'kakou2' },//加工2回目
        { min: 6085, max: 6999, id: 'kakou2' },//加工2回目
        { min: 7001, max: Infinity, id: 'seiniku' },//精肉
    ];

    const matched = ranges.find(r => alignment >= r.min && alignment <= r.max);
    return matched?.id ?? null;
}