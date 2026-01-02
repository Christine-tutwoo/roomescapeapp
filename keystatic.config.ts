import { config, fields, collection, singleton } from '@keystatic/core';

export default config({
  storage: {
    kind: 'local',
  },
  collections: {
    promotions: collection({
      label: '優惠情報',
      slugField: 'title',
      path: 'content/promotions/*',
      format: 'json',
      schema: {
        id: fields.integer({ label: '排序/ID' }),
        studio: fields.text({ label: '工作室名稱' }),
        title: fields.text({ label: '優惠標題' }),
        content: fields.text({
          label: '優惠內容',
          multiline: true,
        }),
        period: fields.text({ label: '優惠期間' }),
        color: fields.text({ 
          label: '漸層顏色類別',
          description: '例如: from-gray-800 to-gray-600'
        }),
        icon: fields.select({
          label: 'Icon',
          description: '前台用來顯示小圖示（不影響內容）',
          defaultValue: 'ticket',
          options: [
            { label: 'Ticket', value: 'ticket' },
            { label: 'DollarSign', value: 'dollar' },
            { label: 'Ghost', value: 'ghost' },
            { label: 'ExternalLink', value: 'external' },
            { label: 'Tag', value: 'tag' },
            { label: 'Clock', value: 'clock' },
            { label: 'Users', value: 'users' },
          ],
        }),
        detailImageUrl: fields.url({
          label: '詳情圖片連結（選填）',
          description: '若提供，前台會顯示「查看詳情」並以彈窗顯示圖片',
          validation: { isRequired: false },
        }),
        detailLink: fields.url({
          label: '詳情外部連結（選填）',
          description: '若提供，前台會顯示「前往連結」',
          validation: { isRequired: false },
        }),
      },
    }),
  },
  singletons: {
    homepage: singleton({
      label: '首頁內容',
      path: 'content/homepage.json',
      format: 'json',
      schema: {
        galleryItems: fields.array(
          fields.object({
            imageUrl: fields.text({
              label: '圖片 URL',
              description: '圖片網址（支援外部連結或 /public 路徑）',
            }),
            videoUrl: fields.text({
              label: '影片 URL（選填）',
              description: '若提供影片，會優先顯示影片而非圖片',
            }),
            title: fields.text({
              label: '標題',
              description: '例如：真實活動剪影、玩家熱情反饋、成團慶祝時刻',
            }),
            desc: fields.text({
              label: '描述（選填）',
            }),
          }),
          {
            label: '活動剪影/圖片',
            description: '首頁「社群口碑」區塊下方的圖片展示',
          }
        ),
      },
    }),
  },
});



