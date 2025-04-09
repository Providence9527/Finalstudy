// src/data/materials.js
export const materials = [
    {
      id: 1,
      title: '高等数学（第七版）',
      author: '同济大学数学系',
      publisher: '高等教育出版社',
      subjects: ['数学', '理工科'],
      formats: ['PDF', 'EPUB'],
      rating: 4.5,
      tags: ['基础课程', '经典教材'],
      thumbnail: 'public/images/soil-prep.jpg'
    },

    {
      id: 2,
      title: '高等数学2（第七版）',
      author: '同济大学数学系',
      publisher: '高等教育出版社',
      subjects: ['数学', '理工科'],
      formats: ['PDF', 'EPUB'],
      rating: 4.5,
      tags: ['基础课程', '经典教材'],
      thumbnail: 'public/images/pruning.jpg'
    },
    // 更多模拟数据...
  ];

 

  export const materialsData = [
    {
      id: 1,
      name: "园艺基础",
      materials: [
        { 
          id: 1, 
          title: "土壤准备", 
          description: "如何准备种植土壤...",
          thumbnail: "/images/soil-prep.jpg" // 添加缩略图路径
        },
        {
          id: 2,
          title: "植物修剪",
          description: "基本修剪技巧...",
          thumbnail: "/images/pruning.jpg"
        }
      ]
    },
    // 其他数据保持相同结构...
  ];