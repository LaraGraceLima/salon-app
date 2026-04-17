import { storage } from '../firebase-config';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

class FirebaseService {
  // Upload image to Firebase Storage
  async uploadImage(imageUri, folder = 'profile-pictures', fileName = null) {
    try {
      console.log('🔥 Starting Firebase upload...');
      
      // Generate unique filename if not provided
      if (!fileName) {
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(7);
        fileName = `${timestamp}_${randomId}.jpg`;
      }

      // Create storage reference
      const storageRef = ref(storage, `${folder}/${fileName}`);
      
      // Convert image URI to blob for upload
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      console.log('📤 Uploading to Firebase Storage...');
      
      // Upload file
      const snapshot = await uploadBytes(storageRef, blob);
      
      console.log('✅ Upload successful!');
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      console.log('🔗 Download URL obtained:', downloadURL);
      
      return {
        success: true,
        downloadURL,
        fileName,
        fullPath: snapshot.ref.fullPath
      };
      
    } catch (error) {
      console.error('❌ Firebase upload error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Delete image from Firebase Storage
  async deleteImage(imagePath) {
    try {
      const imageRef = ref(storage, imagePath);
      await deleteObject(imageRef);
      console.log('🗑️ Image deleted from Firebase Storage');
      return { success: true };
    } catch (error) {
      console.error('❌ Firebase delete error:', error);
      return { success: false, error: error.message };
    }
  }

  // Upload multiple images
  async uploadMultipleImages(imageUris, folder = 'gallery') {
    const results = [];
    
    for (let i = 0; i < imageUris.length; i++) {
      const result = await this.uploadImage(imageUris[i], folder);
      results.push(result);
    }
    
    return results;
  }

  // Get optimized image URL (with resize parameters)
  getOptimizedImageURL(downloadURL, width = 300, height = 300) {
    // Firebase Storage doesn't have built-in image optimization
    // But you can use services like Cloudinary or implement client-side resizing
    return downloadURL;
  }
}

export default new FirebaseService();