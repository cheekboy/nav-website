document.addEventListener('DOMContentLoaded', function() {
    const uploadArea = document.getElementById('uploadArea');
    const imageInput = document.getElementById('imageInput');
    const compressSettings = document.getElementById('compressSettings');
    const imagesList = document.getElementById('imagesList');
    const imagesContainer = document.getElementById('imagesContainer');
    const qualitySlider = document.getElementById('quality');
    const qualityValue = document.getElementById('qualityValue');
    const compressAllBtn = document.getElementById('compressAllBtn');
    const downloadAllBtn = document.getElementById('downloadAllBtn');
    
    let imagesToProcess = [];

    // 上传区域点击事件
    uploadArea.addEventListener('click', () => {
        imageInput.click();
    });

    // 拖拽事件处理
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('drag-over');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        const files = Array.from(e.dataTransfer.files).filter(file => 
            file.type.startsWith('image/'));
        if (files.length > 0) {
            handleImagesUpload(files);
        }
    });

    // 文件选择处理
    imageInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            handleImagesUpload(files);
        }
    });

    // 质量滑块事件
    qualitySlider.addEventListener('input', (e) => {
        qualityValue.textContent = `${e.target.value}%`;
        // 实时更新所有已添加图片的压缩效果
        const quality = e.target.value / 100;
        imagesToProcess.forEach(item => {
            if (item.compressed) {  // 只更新已经压缩过的图片
                compressImage(item, quality);
            }
        });
    });

    // 压缩全部按钮事件
    compressAllBtn.addEventListener('click', () => {
        const total = imagesToProcess.filter(item => !item.compressed).length;
        let completed = 0;
        
        compressAllBtn.textContent = `压缩中 (0/${total})`;
        compressAllBtn.disabled = true;

        const quality = qualitySlider.value / 100;
        imagesToProcess.forEach(item => {
            if (!item.compressed) {
                compressImage(item, quality).then(() => {
                    completed++;
                    compressAllBtn.textContent = `压缩中 (${completed}/${total})`;
                    if (completed === total) {
                        compressAllBtn.textContent = '压缩全部';
                        compressAllBtn.disabled = false;
                    }
                });
            }
        });
    });

    // 下载全部按钮事件
    downloadAllBtn.addEventListener('click', () => {
        imagesToProcess.forEach(item => {
            if (item.compressed) {
                downloadImage(item);
            }
        });
        imageInput.value = '';
    });

    // 添加文件类型检查函数
    function isValidImageType(file) {
        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        return validTypes.includes(file.type);
    }

    // 处理图片上传
    function handleImagesUpload(files) {
        compressSettings.style.display = 'block';
        imagesList.style.display = 'block';

        files.forEach(file => {
            if (!isValidImageType(file)) {
                alert(`文件 ${file.name} 格式不支持，仅支持 JPG、PNG、WebP 格式`);
                return;
            }
            if (file.size > 10 * 1024 * 1024) {
                alert(`图片 ${file.name} 大小超过10MB，已跳过`);
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const imageItem = {
                    id: Date.now() + Math.random(),
                    name: file.name,
                    originalSize: file.size,
                    originalData: e.target.result,
                    compressed: false
                };

                imagesToProcess.push(imageItem);
                addImageToList(imageItem);

                // 添加后立即进行一次压缩
                const quality = qualitySlider.value / 100;
                compressImage(imageItem, quality);
            };
            reader.readAsDataURL(file);
        });

        imageInput.value = '';
    }

    // 添加图片到列表
    function addImageToList(imageItem) {
        const div = document.createElement('div');
        div.className = 'image-item';
        div.id = `image-${imageItem.id}`;
        div.innerHTML = `
            <div class="preview">
                <img src="${imageItem.originalData}" alt="${imageItem.name}">
                <button class="delete-btn" title="删除">×</button>
            </div>
            <div class="info">
                <p>文件名：${imageItem.name}</p>
                <div class="size-info">
                    <div class="original-size">
                        <span>原始大小：</span>
                        <span>${formatFileSize(imageItem.originalSize)}</span>
                    </div>
                    <div class="compressed-size" style="display: none">
                        <span>压缩后：</span>
                        <span class="new-size">-</span>
                        <span class="ratio"></span>
                    </div>
                </div>
            </div>
            <div class="status">
                <span class="status-text">待压缩</span>
                <button class="download-btn" style="display: none">下载</button>
            </div>
        `;

        // 添加删除按钮事件
        const deleteBtn = div.querySelector('.delete-btn');
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            // 从数组和DOM中移除
            imagesToProcess = imagesToProcess.filter(item => item.id !== imageItem.id);
            div.remove();
            
            // 如果没有图片了，隐藏设置和列表区域
            if (imagesToProcess.length === 0) {
                compressSettings.style.display = 'none';
                imagesList.style.display = 'none';
            }

            // 重置 input 的值，这样相同的文件也能重新选择
            imageInput.value = '';
        };

        // 添加点击预览功能
        div.querySelector('.preview').addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-btn')) return;
            updatePreviewArea(imageItem);
        });

        imagesContainer.appendChild(div);
    }

    // 压缩单张图片
    function compressImage(imageItem, quality) {
        try {
            const img = new Image();
            img.onerror = () => handleError('图片加载失败', imageItem);
            img.src = imageItem.originalData;
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    
                    const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                    
                    // 更新图片项
                    imageItem.compressed = true;
                    imageItem.compressedData = compressedDataUrl;
                    
                    // 更新UI
                    updateImageItemUI(imageItem);

                    // 如果是当前预览的图片，更新预览区域
                    const previewArea = document.getElementById('previewArea');
                    if (previewArea.style.display === 'block') {
                        const originalPreview = document.getElementById('originalPreview');
                        if (originalPreview.src === imageItem.originalData) {
                            updatePreviewArea(imageItem);
                        }
                    }

                    // 完成后移除加载状态
                    statusText.classList.remove('loading');
                } catch (error) {
                    handleError('压缩过程出错', imageItem);
                }
            };
        } catch (error) {
            handleError('压缩初始化失败', imageItem);
        }
    }

    // 更新图片项UI
    function updateImageItemUI(imageItem) {
        const itemElement = document.getElementById(`image-${imageItem.id}`);
        if (!itemElement) return;

        const compressedSize = getBase64Size(imageItem.compressedData);
        const compressionRatio = ((1 - compressedSize / imageItem.originalSize) * 100).toFixed(1);

        const compressedSizeElement = itemElement.querySelector('.compressed-size');
        compressedSizeElement.style.display = 'block';
        compressedSizeElement.querySelector('.new-size').textContent = formatFileSize(compressedSize);
        compressedSizeElement.querySelector('.ratio').textContent = 
            `(减小 ${compressionRatio}%)`;
        
        itemElement.querySelector('.status-text').textContent = '已压缩';
        itemElement.querySelector('.status-text').classList.add('success');
        
        const downloadBtn = itemElement.querySelector('.download-btn');
        downloadBtn.style.display = 'block';
        downloadBtn.onclick = () => downloadImage(imageItem);
    }

    // 下载图片
    function downloadImage(imageItem) {
        const link = document.createElement('a');
        link.download = `compressed_${imageItem.name}`;
        link.href = imageItem.compressedData;
        link.click();
    }

    // 获取base64图片大小
    function getBase64Size(base64String) {
        const base64str = base64String.split(',')[1];
        return atob(base64str).length;
    }

    // 格式化文件大小
    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
        else return (bytes / 1048576).toFixed(2) + ' MB';
    }

    // 添加预览区域更新函数
    function updatePreviewArea(imageItem) {
        const originalPreview = document.getElementById('originalPreview');
        const originalSize = document.getElementById('originalSize');
        const originalDimensions = document.getElementById('originalDimensions');
        const compressedPreview = document.getElementById('compressedPreview');
        const compressedSize = document.getElementById('compressedSize');
        const compressedDimensions = document.getElementById('compressedDimensions');
        const previewArea = document.getElementById('previewArea');

        // 显示预览区域
        previewArea.style.display = 'block';

        // 更新原图预览
        originalPreview.src = imageItem.originalData;
        originalSize.textContent = formatFileSize(imageItem.originalSize);

        // 获取图片尺寸
        const img = new Image();
        img.src = imageItem.originalData;
        img.onload = () => {
            originalDimensions.textContent = `${img.width} x ${img.height}`;
            compressedDimensions.textContent = `${img.width} x ${img.height}`;
        };

        // 更新压缩后预览
        compressedPreview.src = imageItem.compressedData;
        const compressedBytes = getBase64Size(imageItem.compressedData);
        compressedSize.textContent = `${formatFileSize(compressedBytes)} (减小 ${((1 - compressedBytes / imageItem.originalSize) * 100).toFixed(1)}%)`;
    }

    // 添加错误处理函数
    function handleError(message, imageItem) {
        const itemElement = document.getElementById(`image-${imageItem.id}`);
        const statusText = itemElement.querySelector('.status-text');
        statusText.textContent = '压缩失败';
        statusText.classList.add('error');
        console.error(message);
    }
}); 