const fs = require('fs');

let rules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Global Safety Net
    match /{document=**} {
      allow read, write: if false;
    }
    
    function isSignedIn() {
      return request.auth != null;
    }
    
    function incoming() {
      return request.resource.data;
    }
    
    function existing() {
      return resource.data;
    }
    
    // We remove the regex match for ID just to be absolutely safe
    function isValidId(id) {
      return id is string && id.size() > 0 && id.size() <= 128;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    match /users/{userId} {
      allow get: if isSignedIn() && isOwner(userId);
      allow create, update: if isSignedIn() && isOwner(userId);
      allow delete: if false;
    }
    
    match /projects/{projectId} {
      // allow read (get and list) if the requested resource belongs to the user
      allow read: if isSignedIn() && resource.data.userId == request.auth.uid;
      
      // Allow create if they set themselves as the owner
      allow create: if isSignedIn() && incoming().userId == request.auth.uid;
      
      // Allow update if they own the existing document, and are not changing the owner
      allow update: if isSignedIn() 
        && existing().userId == request.auth.uid
        && incoming().userId == existing().userId;
        
      allow delete: if isSignedIn() && existing().userId == request.auth.uid;
      
      match /messages/{messageId} {
        allow read: if isSignedIn() 
          && get(/databases/$(database)/documents/projects/$(projectId)).data.userId == request.auth.uid;
          
        allow create: if isSignedIn()
          && get(/databases/$(database)/documents/projects/$(projectId)).data.userId == request.auth.uid
          && incoming().role in ['user', 'model'];
          
        allow update, delete: if false;
      }
    }
  }
}
`;

fs.writeFileSync('firestore.rules', rules);
