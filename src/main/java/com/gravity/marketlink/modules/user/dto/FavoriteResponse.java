package com.gravity.marketlink.modules.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FavoriteResponse {

    private Long favoriteId;
    private Long customerId;
    private String targetType;
    private Long targetId;

    private String targetTitle;
    private String targetSubtitle;
    private String targetImageUrl;

    private LocalDateTime createdAt;
}
